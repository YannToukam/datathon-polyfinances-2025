# app.py
from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import boto3

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
    
    llm_prompt = user_prompt
    
    # 1. Construction du prompt final (RAG)
    if file_content:
        # Injection du contenu dans le prompt pour le RAG
        llm_prompt = (
            f"Voici le contenu du document pour l'analyse:\n\n"
            f"---\n"
            f"{file_content}\n"
            f"---\n\n"
            f"En te basant uniquement sur ce document, réponds à la question suivante: {user_prompt}"
        )
        print("Analyse avec contenu de fichier. Taille du contenu: " + str(len(file_content)) + " caractères.")
    else:
        print("Analyse de dialogue simple.")

    
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    llm_mission = "This is your mission : You are a helpful expert in france cuisine."
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": llm_mission + llm_prompt}
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

        return jsonify({"response": generated_text})
    except Exception as e:
        error_message = f"[Erreur Bedrock] Impossible d'invoquer le modèle. Vérifiez la configuration Bedrock. Erreur: {e}"
        print(error_message)
        return jsonify({"response": error_message}), 500

if __name__ == "__main__":
    app.run(debug=True)