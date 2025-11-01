// src/components/Message.jsx
import React from 'react';

export const Message = ({ content, type }) => {
    // Les types peuvent être 'user' ou 'model'
    const isUser = type === 'user';
    const messageClass = isUser ? 'message-user' : 'message-model';

    return (
        <div className={`message-container ${messageClass}`}>
            <div className="message-icon">
                {isUser ? '👤' : '🤖'}
            </div>
            <div className="message-content">
                <p className="message-type-label">
                    {isUser ? 'Vous' : 'Analyse IA'}
                </p>
                {/* Utiliser <pre> pour préserver les retours à la ligne du modèle */}
                <pre>{content}</pre>
            </div>
        </div>
    );
};