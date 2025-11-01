// src/App.jsx (Version Conversation/Chat)

import React, { useState } from 'react';
import { PromptInput } from './components/PromptInput';
import { DataUploader } from './components/DataUploader';
import { ConversationHistory } from './components/ConversationHistory';
// Importez vos styles ici
import './styles/App.css'; 
import './styles/components.css'

const API_ENDPOINT = "VOTRE_ENDPOINT_API_ICI"; 

const App = () => {
    const [fileContent, setFileContent] = useState(null);
    const [fileExtension, setFileExtension] = useState(null); 
    // État clé : un tableau pour l'historique des messages
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Ajoute un message à l'historique
    const addMessage = (content, type) => {
        setConversationHistory(prev => [...prev, { content, type }]);
    };

    // Gérer le chargement du fichier
    const handleDataLoad = (content, extension) => {
        setFileContent(content);
        setFileExtension(extension);
        addMessage(`Fichier **.${extension}** chargé. Ce fichier sera inclus dans votre prochaine requête.`, 'model');
    };

    // Gérer l'envoi du prompt
    const handlePromptSubmit = async (promptText) => {
        setIsLoading(true);
        // 1. Ajouter le prompt de l'utilisateur à l'historique
        addMessage(promptText, 'user');
        
        // 2. Ajouter un message de chargement du modèle
        addMessage("Analyse en cours. Veuillez patienter...", 'model');

        const payload = {
            prompt: promptText,
            file_data: fileContent,
            file_extension: fileExtension 
        };
        
        console.log("Payload envoyé au modèle:", payload);

        // --- SIMULATION (À REMPLACER PAR fetch(API_ENDPOINT) ) ---
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const fileNameDisplay = fileExtension ? `Fichier .${fileExtension}` : 'Aucun Fichier';
            const mockResponse = `Réponse de l'IA (Basée sur votre requête et ${fileNameDisplay}):\n\n- Taux d'utilisation des actifs: 92%.\n- Recommandation: Consolider les dettes court terme. \n- Le modèle a traité les balises HTML/XML comme prévu.`;
            
            // 3. Remplacer le message de chargement par la réponse finale
            setConversationHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].content = mockResponse;
                newHistory[newHistory.length - 1].type = 'model'; // Assurer le type final
                return newHistory;
            });
            
        } catch (error) {
            // En cas d'erreur, mettre à jour le dernier message (le chargement) avec l'erreur
            setConversationHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].content = `[ERREUR] Impossible de contacter l'API ou de traiter la réponse: ${error.message}`;
                return newHistory;
            });
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