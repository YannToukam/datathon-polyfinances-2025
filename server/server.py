from flask import Flask, request, jsonify
import boto3
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows frontend (React, etc.) to access this API

bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name="us-west-2"  
)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    default_prompt = "Hello, how can I assist you today?"
    user_prompt = data.get("prompt", "") if data else default_prompt
    
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4192,
        "temperature": 0.9,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt}
                ]
            }
        ]
    }

    response = bedrock_client.invoke_model(
        modelId= model_id,
        body=json.dumps(payload)
    )

    result = json.loads(response["body"].read())
    generated_text = "".join(
        [part["text"] for part in result.get("content", []) if "text" in part]
    )

    return jsonify({"response": generated_text})

if __name__ == "__main__":
    app.run(debug=True)
