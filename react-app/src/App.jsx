// src/App.jsx
import React, { useState, useCallback } from 'react';
import { PromptInput } from './components/PromptInput';
import { ConversationHistory } from './components/ConversationHistory';
import PieChart from "./components/Chart";
import DescriptionSection from "./components/DescriptionSection";
import './styles/App.css';
import './styles/components.css';

const CHAT_API_ENDPOINT = "http://127.0.0.1:5000/chat";

const App = () => {
  const [fileContent, setFileContent] = useState(null);
  const [fileExtension, setFileExtension] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [summary, setSummary] = useState("");
  const [stocks, setStocks] = useState([]);              // ✅ liste complète des entreprises
  const [sectors, setSectors] = useState([]);            // ✅ pour le pie chart
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((content, type) => {
    setConversationHistory(prev => [...prev, { content, type }]);
  }, []);

  const updateLastMessage = useCallback((content) => {
    setConversationHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0) {
        newHistory[newHistory.length - 1].content = content;
      } else {
        newHistory.push({ content: content, type: 'model' });
      }
      return newHistory;
    });
  }, []);

  const handleDataLoad = (content, extension, fileName) => {
    setFileContent(content);
    setFileExtension(extension);
    addMessage(`Fichier **${fileName}** (.${extension}) chargé avec succès.`, 'model');
  };

  const handleFileClear = () => {
    setFileContent(null);
    setFileExtension(null);
    addMessage(`Fichier en attente d'analyse annulé.`, 'model');
  };

  const handlePromptSubmit = async (promptText) => {
    setIsLoading(true);
    addMessage(promptText, 'user');
    addMessage("Analyse en cours. Veuillez patienter...", 'model');

    try {
      const payload = {
        prompt: promptText,
        file_content: fileContent,
        file_extension: fileExtension,
      };

      const res = await fetch(CHAT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (fileContent) {
        setFileContent(null);
        setFileExtension(null);
      }

      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();

      updateLastMessage(data.response);

      // ✅ Nouveau : on récupère les 3 blocs de données
      setSummary(data.response.summary || "No summary available.");
      setStocks(data.response.stocks || []);
      setSectors(data.response.sector_distribution || []);

    } catch (error) {
      console.error("Erreur:", error);
      updateLastMessage(`[ERREUR] ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="datathon-app">
      <div className="main-interface">

        {/* --- COLONNE GAUCHE --- */}
        <div id="description-section">
          {/* ✅ Envoie tous les stocks à DescriptionSection */}
          <DescriptionSection variations={stocks} />
        </div>

        {/* --- GRAPHIQUE ET RÉSUMÉ --- */}
        <div id="pie-chart">
          {/* ✅ Tu pourras connecter sectors ici */}
          <PieChart data={sectors} />
          <div className="chart-summary">
            <h3>Market Summary</h3>
            <p>
              {summary
                ? summary
                : "Awaiting analysis... Submit a prompt to see your portfolio summary."}
            </p>
          </div>
        </div>

        {/* --- CHAT --- */}
        <div className="conversation-zone">
          <ConversationHistory history={conversationHistory} />
          <PromptInput
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
            onDataLoad={handleDataLoad}
            onFileClear={handleFileClear}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
