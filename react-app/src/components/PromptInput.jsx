// src/components/PromptInput.jsx

import React, { useState } from 'react';

export const PromptInput = ({ onSubmit, isLoading }) => { 
    const [promptText, setPromptText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (promptText.trim() && !isLoading) {
            // 1. Envoyer le texte au composant parent
            onSubmit(promptText.trim());
            // 2. Vider le champ de saisie
            setPromptText(''); 
        }
    };

    return (
        <form className="prompt-input" onSubmit={handleSubmit}>
            <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ex: Analysez le fichier et fournissez les 3 principales conclusions."
                rows="2"
                disabled={isLoading}
            />
            <button type="submit" disabled={!promptText.trim() || isLoading}>
                {isLoading ? 'Analyse...' : 'Analyser 🚀'} 
            </button>
        </form>
    );
};