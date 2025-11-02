// src/components/PromptInput.jsx
import React, { useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';



export const PromptInput = ({ onSubmit, isLoading }) => { 
    const [promptText, setPromptText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (promptText.trim() && !isLoading) {
            onSubmit(promptText.trim());
            setPromptText(''); 
        }
    };

    const handleKeyDown = (e) => {
        // Envoie si la touche est 'Enter' et que 'Shift' n'est PAS enfoncée
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSubmit(e); 
            
        }
    };

    return (
        <form id = "prompt-input" className="prompt-input" onSubmit={handleSubmit}>
            <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown} 
                placeholder="Ex: Analysez le fichier et fournissez les 3 principales conclusions."
                rows="2"
                disabled={isLoading}
            />
            <button type="submit" disabled={!promptText.trim() || isLoading}>
                {isLoading ? 'Analyse...' : <FaArrowUp style = {{fontSize: "25px"}}/>} 
                
            </button>
        </form>
    );
};