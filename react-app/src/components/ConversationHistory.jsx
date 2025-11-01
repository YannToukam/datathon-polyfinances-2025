// src/components/ConversationHistory.jsx
import React, { useRef, useEffect } from 'react';
import { Message } from './Message';

export const ConversationHistory = ({ history }) => {
    // Référence pour maintenir le défilement en bas (auto-scroll)
    const endOfMessagesRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Défile vers le bas chaque fois que l'historique est mis à jour
    useEffect(scrollToBottom, [history]);

    if (history.length === 0) {
        return (
            <div className="conversation-history-empty">
                Démarrez une nouvelle conversation. Chargez un fichier et posez une question !
            </div>
        );
    }

    return (
        <div className="conversation-history-container">
            {history.map((msg, index) => (
                <Message 
                    key={index} 
                    content={msg.content} 
                    type={msg.type} 
                />
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};