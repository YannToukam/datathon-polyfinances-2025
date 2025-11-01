# app.py
from flask import Flask, request, jsonify
import boto3
import json
import uuid
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows frontend (React, etc.) to access this API

# --- CONFIGURATION AWS S3/BEDROCK ---
S3_BUCKET_NAME = "datathon-analysis-bucket" # CHANGEZ CE NOM pour votre bucket S3 réel
S3_REGION = "us-west-2" 
# --- FIN CONFIGURATION ---

# Initialisation des clients AWS
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=S3_REGION  
)

s3_client = boto3.client(
    "s3",
    region_name=S3_REGION
)

@app.route("/upload_url", methods=["POST"])
def get_upload_url():
    """Génère une URL de pré-signature pour l'upload direct vers S3 depuis le navigateur."""
    data = request.get_json()
    file_extension = data.get("file_extension", "txt").lower()
    
    # Génère une clé unique pour l'objet S3
    object_key = f"temp-uploads/{uuid.uuid4()}.{file_extension}"

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': object_key,
                'ContentType': 'text/plain' # Défini pour les fichiers texte/CSV/JSON
            },
            ExpiresIn=300 # URL expire après 5 minutes
        )
        return jsonify({"upload_url": presigned_url, "s3_key": object_key})
    except Exception as e:
        print(f"Erreur lors de la génération de l'URL de pré-signature: {e}")
        return jsonify({"error": f"Impossible de générer l'URL d'upload. Vérifiez le bucket S3: {S3_BUCKET_NAME}"}), 500

@app.route("/chat", methods=["POST"])
def chat():
    """Télécharge le fichier S3 (si une clé est fournie) et appelle le modèle Bedrock."""
    data = request.get_json()
    user_prompt = data.get("prompt", "")
    s3_key = data.get("s3_key") # Nouvelle clé S3 reçue du frontend

    file_content = ""
    llm_prompt = user_prompt
    
    # 1. Téléchargement du fichier depuis S3 (si une clé est présente)
    if s3_key:
        try:
            print(f"Téléchargement du fichier S3: {s3_key}")
            s3_object = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            # Lecture du contenu du fichier
            file_content = s3_object['Body'].read().decode('utf-8')
            
            # 2. Nettoyage: Suppression du fichier temporaire après lecture
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            print(f"Fichier S3 supprimé: {s3_key}")
            
            # 3. Construction du prompt final
            llm_prompt = (
                f"Voici le contenu du fichier pour l'analyse:\n\n"
                f"---\n"
                f"{file_content}\n"
                f"---\n\n"
                f"Analyse: {user_prompt}"
            )
        except Exception as e:
            error_message = f"[Erreur S3: Impossible de lire/supprimer le fichier pour l'analyse. Vérifiez que le bucket {S3_BUCKET_NAME} existe et que les permissions sont correctes. Erreur: {e}] Prompt: {user_prompt}"
            print(error_message)
            return jsonify({"response": error_message})


    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": llm_prompt}
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
        error_message = f"[Erreur Bedrock] Impossible d'invoquer le modèle. Vérifiez vos configurations AWS. Erreur: {e}"
        print(error_message)
        return jsonify({"response": error_message}), 500

if __name__ == "__main__":
    app.run(debug=True)