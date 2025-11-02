// src/App.jsx
import React, { useState, useCallback } from 'react';
import { PromptInput } from './components/PromptInput';
import { DataUploader } from './components/DataUploader';
import { ConversationHistory } from './components/ConversationHistory';
import PieChart from "./components/Chart";
import DescriptionSection from "./components/DescriptionSection";
// Importez vos styles ici
import './styles/App.css';
import './styles/components.css'

// Endpoint unique : Chat
const CHAT_API_ENDPOINT = "http://127.0.0.1:5000/chat";

const App = () => {
    // État du fichier en cours de chargement (son contenu brut et son extension)
    const [fileContent, setFileContent] = useState(null);
    const [fileExtension, setFileExtension] = useState(null);
    // État clé : un tableau pour l'historique des messages
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Ajoute un essage à l'historique
    const addMessage = useCallback((content, type) => {
        setConversationHistory(prev => [...prev, { content, type }]);
    }, []);

    // Met à jour le dernier message (utilisé pour remplacer le message de chargement par la réponse finale)
    const updateLastMessage = useCallback((content) => {
        setConversationHistory((prev) => {
            const newHistory = [...prev];
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
        addMessage(`Fichier **.${extension}** chargé. Le contenu sera envoyé directement pour analyse lors du prochain envoi.`, 'model');
    };

    // Fonction d'annulation du chargement du fichier localement
    const handleFileClear = () => {
        setFileContent(null);
        setFileExtension(null);
        addMessage(`Fichier en attente d'analyse annulé. Vous pouvez en charger un nouveau.`, 'model');
    };

    // Gérer l'envoi du prompt
    const handlePromptSubmit = async (promptText) => {

        setIsLoading(true);
        // 1. Ajouter le prompt de l'utilisateur à l'historique
        addMessage(promptText, 'user');

        let analysisMessage = "Analyse en cours. Veuillez patienter...";

        // 2. Ajouter un message de chargement
        addMessage(analysisMessage, 'model');

        try {
            // Étape Chat: Appel à l'API. On inclut le fichier s'il est présent
            const payload = {
                prompt: promptText,
                // Si fileContent est non-null, on l'envoie. Sinon, null.
                file_content: fileContent,
                file_extension: fileExtension,
            };

            const res = await fetch(CHAT_API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // Si la requête réussit, on nettoie le fichier localement pour éviter le double envoi
            if (fileContent) {
                setFileContent(null);
                setFileExtension(null);
            }

            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }

            const data = await res.json();

            // Actualiser le dernier message du modèle avec la réponse réelle
            updateLastMessage(data.response);

        } catch (error) {
            console.error("Erreur dans le processus d'analyse:", error);
            updateLastMessage(`[ERREUR FATALE] Un problème est survenu. Le contenu du fichier n'a pas été envoyé. ${error.message}`);
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
                <div className="file-upload-section">
                    <DataUploader
                        onDataLoad={handleDataLoad}
                        onFileClear={handleFileClear}
                    />
                </div>

                <div className="dashboard-container">
                    <div id="description-section">
                        <DescriptionSection />
                    </div>
                    <div id="pie-chart">
                        <PieChart />
                    </div>

                </div>



                <div className="conversation-zone">
                    <ConversationHistory history={conversationHistory} />
                    <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default App;