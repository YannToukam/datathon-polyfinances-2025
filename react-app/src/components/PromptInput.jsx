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

    const handleKeyDown = (e) => {
        // Envoie si la touche est 'Enter' et que 'Shift' n'est PAS enfoncée
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Empêche le saut de ligne par défaut
            handleSubmit(e); // Appelle la fonction d'envoi
        }
    };

    return (
        <form className="prompt-input" onSubmit={handleSubmit}>
            <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown} // AJOUTÉ : Gestion de la touche Enter
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