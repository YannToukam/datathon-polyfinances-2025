// src/App.jsx
import React, { useState, useCallback } from 'react';
import { PromptInput } from './components/PromptInput';
import { DataUploader } from './components/DataUploader';
import { ConversationHistory } from './components/ConversationHistory';
// Importez vos styles ici
import './styles/App.css';
import './styles/components.css'

const CHAT_API_ENDPOINT = "http://127.0.0.1:5000/chat";
const UPLOAD_URL_API_ENDPOINT = "http://127.0.0.1:5000/upload_url";

const App = () => {
    // État du fichier en cours de chargement (son contenu brut et son extension)
    const [fileContent, setFileContent] = useState(null);
    const [fileExtension, setFileExtension] = useState(null);
    // État clé : un tableau pour l'historique des messages
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Ajoute un message à l'historique
    const addMessage = useCallback((content, type) => {
        setConversationHistory(prev => [...prev, { content, type }]);
    }, []);

    // Met à jour le dernier message (utilisé pour remplacer le message de chargement par la réponse finale)
    const updateLastMessage = useCallback((content) => {
        setConversationHistory((prev) => {
            const newHistory = [...prev];
            // Assurez-vous qu'il y a un message à mettre à jour
            if (newHistory.length > 0) {
                newHistory[newHistory.length - 1].content = content;
            } else {
                newHistory.push({ content: content, type: 'model' });
            }
            return newHistory;
        });
    }, []);

    // Gérer le chargement du fichier (stocke le contenu brut)
    const handleDataLoad = (content, extension) => {
        setFileContent(content);
        setFileExtension(extension);
        addMessage(`Fichier **.${extension}** chargé. Le contenu sera uploadé sur S3 et analysé lors du prochain envoi.`, 'model');
    };

    // Nouvelle fonction pour gérer l'upload vers S3
    const uploadToS3 = async (content, extension) => {
        // 1. Demander une URL de pré-signature au backend
        const urlRes = await fetch(UPLOAD_URL_API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_extension: extension }),
        });

        if (!urlRes.ok) {
            throw new Error("Échec de l'obtention de l'URL de pré-signature.");
        }
        
        const { upload_url, s3_key } = await urlRes.json();
        
        // 2. Uploader le contenu brut directement sur S3 avec l'URL pré-signée
        const uploadRes = await fetch(upload_url, {
            method: "PUT",
            // Le type Content-Type doit correspondre à celui défini lors de la génération de l'URL
            headers: { "Content-Type": "text/plain" }, 
            body: content,
        });

        if (!uploadRes.ok) {
            throw new Error(`Échec de l'upload S3 (Statut: ${uploadRes.status}).`);
        }

        return s3_key;
    };


    // Gérer l'envoi du prompt
    const handlePromptSubmit = async (promptText) => {

        setIsLoading(true);
        // 1. Ajouter le prompt de l'utilisateur à l'historique
        addMessage(promptText, 'user');

        let currentS3Key = null;
        let analysisMessage = "Analyse en cours. Veuillez patienter...";

        try {
            if (fileContent && fileExtension) {
                analysisMessage = "Upload S3, puis analyse en cours. Veuillez patienter...";
                addMessage(analysisMessage, 'model');

                // Étape S3: Upload du fichier
                const s3Key = await uploadToS3(fileContent, fileExtension);
                currentS3Key = s3Key;

                // Une fois l'upload réussi, on nettoie l'état local du fichier
                setFileContent(null); 
                setFileExtension(null);
            } else {
                addMessage(analysisMessage, 'model');
            }

            // Étape Chat: Appel à l'API avec la clé S3 (si elle existe)
            const payload = {
                prompt: promptText,
                s3_key: currentS3Key, // Le backend saura s'il doit télécharger
            };

            const res = await fetch(CHAT_API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            
            // Actualiser le dernier message du modèle avec la réponse réelle
            updateLastMessage(data.response);

        } catch (error) {
            console.error("Erreur dans le processus d'analyse:", error);
            updateLastMessage(`[ERREUR FATALE] Un problème est survenu. ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="datathon-app">
            <header className="app-header">
                <h1>💬 Moteur d'Analyse Dialogue (Datathon)</h1>
            </header>

            <div className="main-interface">
                {/* Section d'Upload séparée de la conversation */}
                <div className="file-upload-section">
                    <DataUploader onDataLoad={handleDataLoad} />
                </div>

                {/* Historique de la Conversation */}
                <div className="conversation-zone">
                    <ConversationHistory history={conversationHistory} />

                    {/* Input toujours en bas */}
                    <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default App;