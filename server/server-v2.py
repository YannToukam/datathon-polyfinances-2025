from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import boto3
import random
from urllib.request import urlretrieve
import os
import tempfile
import datetime
import re


# --- Embeddings Titan (demo locale) ---
def get_titan_embedding(text: str):
    """Crée un embedding 1024-dim avec Titan pour n'importe quel texte."""
    response = bedrock_client.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": text})
    )
    result = json.loads(response["body"].read())
    return result["embedding"]  # liste de 1024 floats


# --- CONFIGURATION AWS ---
S3_REGION = "us-west-2"
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=S3_REGION
)
s3_client = boto3.client("s3")
aoss_client = boto3.client("opensearchserverless")
bedrock_agent_client = boto3.client("bedrock-agent")

# --- FLASK APP ---
app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 Mo max

# --- VARIABLES ---
resource_suffix = random.randrange(100, 999)
s3_bucket_name = "rag-data-pf-2025"
local_data_dir = "./data"
os.makedirs(local_data_dir, exist_ok=True)

print("AWS Region:", S3_REGION)
print("S3 Bucket:", s3_bucket_name)

# --- S3 SYNC ---
try:
    s3_client.head_bucket(Bucket=s3_bucket_name)
    print(f"✅ Bucket '{s3_bucket_name}' already exists.")
except Exception as e:
    print(f"🪣 Creating bucket: {s3_bucket_name}")
    if S3_REGION == "us-west-2":
        s3_client.create_bucket(Bucket=s3_bucket_name)
    else:
        s3_client.create_bucket(
            Bucket=s3_bucket_name,
            CreateBucketConfiguration={'LocationConstraint': S3_REGION}
        )

# Télécharger tous les fichiers S3 vers ./data
"""objects = s3_client.list_objects_v2(Bucket=s3_bucket_name)
for obj in objects.get('Contents', []):
    key = obj['Key']
    if key.endswith('/'):
        continue
    filename = key.split('/')[-1]
    local_path = os.path.join(local_data_dir, filename)
    s3_client.download_file(s3_bucket_name, key, local_path)
    print(f"📥 Downloaded '{filename}' → '{local_path}'")"""

# --- Lazy Loader : télécharge uniquement les fichiers pertinents ---
# --- Lazy Loader amélioré : ne télécharge que les fichiers pertinents ---
def download_relevant_files(user_prompt, bucket, local_dir, max_files=5):
    """
    Télécharge seulement les fichiers dont le nom contient un mot clé du prompt.
    Si aucun mot ne correspond, télécharge quelques fichiers généraux (ex: reddit, regulation, news).
    """
    # Liste de mots-clés du prompt + versions anglaises
    keywords = [w.lower() for w in user_prompt.split() if len(w) > 3]
    english_fallback = {
        "chine": "china", "énergie": "energy", "régulation": "regulation",
        "marché": "market", "américain": "us", "loi": "law", "financier": "finance"
    }
    keywords += [english_fallback.get(k, k) for k in keywords]

    objects = s3_client.list_objects_v2(Bucket=bucket)
    downloaded = 0
    fallback_files = ["reddit", "x.json", "analysis", "regulation", "act", "directive"]

    for obj in objects.get("Contents", []):
        key = obj["Key"]
        if key.endswith('/'):
            continue

        # Cherche un mot clé ou un fallback dans le nom du fichier
        if any(kw in key.lower() for kw in keywords + fallback_files):
            filename = key.split('/')[-1]
            local_path = os.path.join(local_dir, filename)
            if not os.path.exists(local_path):
                s3_client.download_file(bucket, key, local_path)
                print(f"✅ Téléchargé : {filename}")
                downloaded += 1
            if downloaded >= max_files:
                break

    if downloaded == 0:
        print("⚠️ Aucun fichier correspondant trouvé dans S3. Téléchargement de fichiers de secours...")
        # Télécharge par défaut quelques fichiers utiles
        for obj in objects.get("Contents", []):
            if any(f in obj["Key"].lower() for f in fallback_files):
                filename = obj["Key"].split('/')[-1]
                local_path = os.path.join(local_dir, filename)
                if not os.path.exists(local_path):
                    s3_client.download_file(bucket, obj["Key"], local_path)
                    print(f"📦 Fichier par défaut téléchargé : {filename}")
                    downloaded += 1
                if downloaded >= 3:
                    break






# --- CONTEXTE LOCAL (RAG) ---
def get_context_from_local_files(user_query, max_files=3):
    """
    Parcourt le dossier ./data pour trouver des fichiers contenant des mots du prompt utilisateur.
    Retourne un texte concaténé pour enrichir le contexte du modèle.
    """
    local_dir = "./data"
    context_snippets = []
    matched_files = []

    # Découpe la requête en mots-clés simples
    keywords = [w.lower() for w in user_query.split() if len(w) > 3]

    for root, _, files in os.walk(local_dir):
        for file in files:
            if file.endswith((".txt", ".html", ".xml", ".csv")):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read()
                        if any(kw in text.lower() for kw in keywords):
                            snippet = text[:1500]
                            context_snippets.append(snippet)
                            matched_files.append(file)
                            print(f"✅ Fichier pertinent trouvé : {file}")
                            if len(context_snippets) >= max_files:
                                break
                except Exception as e:
                    print(f"⚠️ Erreur lecture {file}: {e}")
                    continue

    if not matched_files:
        print("❌ Aucun contexte pertinent trouvé.")
    return "\n\n".join(context_snippets)


# --- ROUTE CHAT ---
@app.route("/chat", methods=["POST"])
def chat():
    """Reçoit le prompt utilisateur et appelle le modèle Bedrock."""
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"response": f"[Erreur JSON] {e}"}), 413

    user_prompt = data.get("prompt", "")
    file_content = data.get("file_content")
    file_extension = data.get("file_extension")

    s3_url = None

    # --- Étape 1 : upload d’un éventuel fichier utilisateur ---
    if file_content:
        try:
            timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            file_key = f"uploads/{timestamp}.{file_extension or 'txt'}"

            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension or 'txt'}") as tmp:
                tmp.write(file_content.encode("utf-8"))
                tmp_path = tmp.name

            s3_client.upload_file(tmp_path, s3_bucket_name, file_key)
            os.remove(tmp_path)

            s3_url = f"s3://{s3_bucket_name}/{file_key}"
            print(f"✅ Fichier uploadé : {s3_url}")
        except Exception as e:
            return jsonify({"response": f"[Erreur S3] {e}"}), 500

    # --- Étape 2 : RAG (recherche de contexte local) ---
    download_relevant_files(user_prompt, s3_bucket_name, local_data_dir)

    context_text = get_context_from_local_files(user_prompt)
    if context_text:
        llm_prompt = (
            f"Relevant context extracted from S3 documents:\n{context_text}\n\n"
            f"User question: {user_prompt}"
        )
        print("📚 Contexte enrichi ajouté au prompt.")
    else:
        llm_prompt = user_prompt
        print("⚠️ Aucun contexte ajouté.")

    # --- Étape 3 : Appel au modèle Bedrock ---
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    system_prompt = (
        "You are 'Regulus', an AI Regulatory Intelligence Analyst designed for financial decision support.\n"
        "You have access to documents stored on Amazon S3 — including regulations, company filings, Reddit and X comments, "
        "and market news enriched via AWS Comprehend. Your task is to retrieve, interpret, and integrate this context "
        "to produce concise, explainable, and economically relevant insights for portfolio management.\n\n"
        "Follow this reasoning pipeline:\n"
        "1. Retrieve relevant data from S3 based on the user's question.\n"
        "2. Summarize key entities, sectors, and regulations mentioned.\n"
        "3. Assess the potential financial impact on S&P 500 constituents.\n"
        "4. Generate clear, structured recommendations (rotation, reallocation, replacements).\n"
        "5. Output your findings strictly as a JSON object with the following keys:\n\n"
        "{\n"
        "  'summary': 'Concise explanation of the regulation or market sentiment',\n"
        "  'entities': ['List of companies, sectors, or regions impacted'],\n"
        "  'impact_score': 'Float from 0 (neutral) to 1 (critical)',\n"
        "  'impact_reasoning': '2-3 sentences explaining why these entities are affected',\n"
        "  'recommendations': ['Concrete portfolio actions (sector rotation, reallocation, etc.)'],\n"
        "  'confidence': '0–1 measure of model confidence',\n"
        "  'sources': ['List of S3 object keys or source summaries used']\n"
        "}\n\n"
        "Constraints:\n"
        "- Never hallucinate companies or events not found in S3 or Comprehend data.\n"
        "- Cite data provenance explicitly (mention which S3 or news item informed the result).\n"
        "- Keep the tone professional, concise, and explainable for financial analysts.\n"
        "- The final output must always be valid JSON parsable by JavaScript."
    )

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": llm_prompt}]}
        ]
    }

    try:
        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=json.dumps(payload)
        )
        result = json.loads(response["body"].read())
        generated_text = "".join(
            [part["text"] for part in result.get("content", []) if "text" in part]
        )
        return jsonify({"response": generated_text, "s3_url": s3_url}), 200

    except Exception as e:
        print(f"❌ Erreur Bedrock: {e}")
        return jsonify({"response": f"[Erreur Bedrock] {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
