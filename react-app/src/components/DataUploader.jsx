// src/components/DataUploader.jsx

import React, { useState } from 'react';

export const DataUploader = ({ onDataLoad }) => {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        const allowedExtensions = ['txt', 'csv', 'html', 'xml', 'json', 'log']; 
        
        if (!allowedExtensions.includes(fileExtension)) {
            setError(`Format .${fileExtension} non standard, mais l'équipe d'IA est flexible. Tentative de chargement...`);
        } else {
             setError(null);
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawContent = e.target.result;
            // Transmet le contenu brut (avec balises si HTML/XML) et l'extension
            onDataLoad(rawContent, fileExtension); 
        };
        reader.onerror = () => {
            setError("Erreur lors de la lecture du fichier.");
        };
        reader.readAsText(file); // Lecture en tant que texte pour tout format
    };

    return (
        <div className="data-uploader">
            <label className="uploader-label">
                📂 Uploader Fichier Données (Multi-Format)
                <input 
                    type="file" 
                    accept=".txt, .csv, .html, .xml, text/plain, application/json" 
                    onChange={handleFileChange} 
                />
            </label>
            {fileName && <p className="file-info">Fichier chargé : **{fileName}**</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};