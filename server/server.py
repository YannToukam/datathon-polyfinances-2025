# app.py
from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import boto3
import random
from urllib.request import urlretrieve
import os
import tempfile
import datetime


# Configuration AWS
S3_REGION = "us-west-2" 
# Assurez-vous que vos identifiants AWS sont configurés (variables d'environnement, profil, ou rôle IAM)
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=S3_REGION  
)

app = Flask(__name__)
CORS(app) 


# --- AJOUT CRUCIAL ---
# Augmenter la limite de taille de la requête (16 Mo)
# Nécessaire pour envoyer des fichiers volumineux dans le corps JSON
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 
# ---------------------

# Create boto3 clients for AOSS, Bedrock, and S3 services
aoss_client = boto3.client('opensearchserverless')
bedrock_agent_client = boto3.client('bedrock-agent')
s3_client = boto3.client('s3')

# Define names for AOSS, Bedrock, and S3 resources
resource_suffix = random.randrange(100, 999)
s3_bucket_name = "rag-data-pf-2025"
aoss_collection_name = f"bedrock-kb-collection-{resource_suffix}"
aoss_index_name = f"bedrock-kb-index-{resource_suffix}"
bedrock_kb_name = f"bedrock-kb-{resource_suffix}"

# Set the Bedrock model to use for embedding generation
embedding_model_id = 'amazon.titan-embed-text-v2:0'
embedding_model_arn = f'arn:aws:bedrock:{S3_REGION}::foundation-model/{embedding_model_id}'
embedding_model_dim = 1024

# Print configurations
print("AWS Region:", S3_REGION)
print("S3 Bucket:", s3_bucket_name)
print("AOSS Collection Name:", aoss_collection_name)
print("Bedrock Knowledge Base Name:", bedrock_kb_name)


# Check if bucket exists, and if not create S3 bucket for KB data source
try:
    s3_client.head_bucket(Bucket=s3_bucket_name)
    print(f"Bucket '{s3_bucket_name}' already exists..")
except Exception as e:
    print(f"Creating bucket: '{s3_bucket_name}'..")
    if S3_REGION == 'us-west-2':
        s3_client.create_bucket(Bucket=s3_bucket_name)
    else:
        s3_client.create_bucket(
            Bucket=s3_bucket_name,
            CreateBucketConfiguration={'LocationConstraint': S3_REGION}
        )
        
local_data_dir = "./data"

os.makedirs(local_data_dir, exist_ok=True)

# ------------------------
# Smart S3 Downloader
# ------------------------
objects = s3_client.list_objects_v2(Bucket=s3_bucket_name)
for obj in objects.get('Contents', []):
    key = obj['Key']

    if key.endswith('/'):
        continue

    filename = key.split('/')[-1]

    local_path = os.path.join(local_data_dir, filename)

    s3_client.download_file(s3_bucket_name, key, local_path)
    print(f"X Downloaded '{filename}' → '{local_path}'")

@app.route("/chat", methods=["POST"])
def chat():
    """Reçoit le prompt et le contenu du fichier (si fourni) pour appeler le modèle Bedrock."""
    
    try:
        # Tente de récupérer les données JSON (échoue si la requête est trop grosse)
        data = request.get_json()
    except Exception as e:
        error_message = f"[Erreur JSON] Le corps de la requête est invalide ou dépasse la limite de taille (16 Mo). Erreur: {e}"
        print(error_message)
        # Retourne un code 413 (Payload Too Large) si c'est le cas
        return jsonify({"response": error_message}), 413


    user_prompt = data.get("prompt", "")
    file_content = data.get("file_content") 
    file_extension = data.get("file_extension")
    llm_prompt = user_prompt

    s3_url = None
    
    # 1. Construction du prompt final (RAG)
    if file_content:
        try:
            timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            file_key = f"uploads/{timestamp}.{file_extension or 'txt'}"

            # Écrire contenu dans un fichier temporaire pour upload_file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension or 'txt'}") as tmp:
                tmp.write(file_content.encode("utf-8"))
                tmp_path = tmp.name

            s3_client.upload_file(tmp_path, s3_bucket_name, file_key)
            os.remove(tmp_path)

            s3_url = f"s3://{s3_bucket_name}/{file_key}"
            print(f"✅ Fichier envoyé sur S3 : {s3_url}")

        except Exception as e:
            error_message = f"[Erreur S3] Impossible d'envoyer le fichier sur S3 : {e}"
            print(error_message)
            return jsonify({"response": error_message}), 500

    llm_prompt = user_prompt
    if file_content:
        llm_prompt = (
            f"Voici un fichier stocké à l'adresse {s3_url}.\n"
            f"Basé sur ce document, réponds à la question suivante : {user_prompt}"
        )

    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    llm_mission = "You are a helpful assistant specialized in business data interpretation."
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
    "- The final output must always be valid JSON parsable by JavaScript.")
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "system" : system_prompt,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": llm_mission + "\n\n" + llm_prompt}
                ]
            }
        ]
    }

    try:
        response = bedrock_client.invoke_model(
            modelId= model_id,
            body=json.dumps(payload)
        )

        result = json.loads(response["body"].read())
        generated_text = "".join(
            [part["text"] for part in result.get("content", []) if "text" in part]
        )

        return jsonify({
            "response": generated_text,
            "s3_url": s3_url
        }), 200
    
    except Exception as e:
        error_message = f"[Erreur Bedrock] Impossible d'invoquer le modèle. Vérifiez la configuration Bedrock. Erreur: {e}"
        print(error_message)
        return jsonify({"response": error_message}), 500



if __name__ == "__main__":
    app.run(debug=True)