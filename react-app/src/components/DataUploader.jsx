// src/components/DataUploader.jsx
import React, { useState, useRef } from 'react';

export const DataUploader = ({ onDataLoad, onFileClear }) => {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setError(null);
        onFileClear(); // Vide l'état du fichier précédent

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
            onDataLoad(rawContent, fileExtension); 
        };
        reader.onerror = () => {
            setError("Erreur lors de la lecture du fichier.");
        };
        reader.readAsText(file); 
    };

    const handleClear = () => {
        setFileName('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Réinitialise l'élément input natif
        }
        onFileClear(); // Vide le contenu du fichier dans l'état global
    };


    return (
        <div className="data-uploader">
            <label className="uploader-label">
                📂 Uploader Fichier Données (Multi-Format)
                <input 
                    type="file" 
                    accept=".txt, .csv, .html, .xml, text/plain, application/json" 
                    onChange={handleFileChange} 
                    ref={fileInputRef} 
                />
            </label>
            
            {fileName && (
                <div className="file-status-row">
                    <p className="file-info">Fichier chargé : **{fileName}**</p>
                    <button 
                        type="button" 
                        onClick={handleClear} 
                        className="clear-file-button"
                    >
                        <span aria-hidden="true">❌</span> Annuler
                    </button>
                </div>
            )}

            {error && <p className="error-message">{error}</p>}
        </div>
    );
};