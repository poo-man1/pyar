import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, WarningIcon, ReportIcon } from './icons';

export interface Message {
  id: number;
  text: string;
  sender: 'local' | 'remote';
  isToxic?: boolean;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onReportMessage: (message: Message) => void;
}

const ChatMessage: React.FC<{ message: Message, onReport: () => void }> = ({ message, onReport }) => {
    const isLocal = message.sender === 'local';
    return (
        <div className={`group flex items-start gap-2.5 my-2 ${isLocal ? 'justify-end' : ''}`}>
            <div className={`flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 rounded-xl ${isLocal ? 'bg-orange-500 rounded-br-none text-white' : 'bg-gray-700 rounded-bl-none text-gray-200'}`}>
                <p className="text-sm font-normal">{message.text}</p>
            </div>
            {message.isToxic && (
                 <div className="text-red-400 self-center" title="This message was flagged as potentially toxic.">
                    <WarningIcon className="w-5 h-5" />
                 </div>
            )}
            {!isLocal && (
                <button onClick={onReport} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-center" aria-label="Report this message">
                    <ReportIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, onReportMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
        <div className="p-3 border-b border-gray-700 font-semibold text-center flex-shrink-0">
            <h3 className="text-lg">Chat</h3>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Say hello! Messages are monitored.
                </div>
            ) : (
                messages.map(msg => <ChatMessage key={msg.id} message={msg} onReport={() => onReportMessage(msg)} />)
            )}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-gray-900/50 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-gray-700 text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    disabled={!inputValue.trim()}
                    aria-label="Send message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    </div>
  );
};
