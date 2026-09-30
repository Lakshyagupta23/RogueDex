'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

interface ChatBoxProps {
  chatLog: ChatMessage[];
  username: string;
  onSendMessage: (msg: string) => void;
}

export default function ChatBox({ chatLog, username, onSendMessage }: ChatBoxProps) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden select-none">
      
      {/* Header */}
      <div className="bg-[#0f1422] border-b border-slate-900 px-4 py-3 flex items-center gap-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-black text-white uppercase tracking-wider">Room Live Chat</span>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {chatLog.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-8">
            <MessageSquare className="w-8 h-8 text-slate-500 mb-2" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No messages yet</span>
            <span className="text-[9px] text-slate-500 font-bold mt-0.5">Send a message to start chatting!</span>
          </div>
        ) : (
          chatLog.map((msg, idx) => {
            const isMe = msg.sender === username;
            return (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{msg.sender}</span>
                  <span className="text-[8px] font-bold text-slate-600">{formatTime(msg.timestamp)}</span>
                </div>
                
                {/* Bubble */}
                <div 
                  className={`px-3 py-2 rounded-2xl text-xs font-bold leading-relaxed break-all ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Input Footer */}
      <form 
        onSubmit={handleSend}
        className="p-3 bg-[#0f1422] border-t border-slate-900 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message here..."
          className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
