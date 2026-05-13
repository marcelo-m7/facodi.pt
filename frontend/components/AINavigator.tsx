
import React, { useState, useRef, useEffect } from 'react';
import { CurricularUnit } from '../types';
import { supabase } from '../services/supabase';

interface AINavigatorProps {
  units: CurricularUnit[];
}

const AINavigator: React.FC<AINavigatorProps> = ({ units }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const context = JSON.stringify(units.map(u => ({
        id: u.id,
        name: u.name,
        category: u.category,
        ects: u.ects,
        desc: u.description
      })));

      const { data, error } = await supabase.functions.invoke('ai-curriculum-navigator', {
        body: {
          query: userText,
          context,
        },
      });

      if (error) {
        throw new Error(error.message || 'Falha ao contactar o servico de IA.');
      }

      const responseText = typeof data?.answer === 'string' ? data.answer : 'Desculpe, nao consegui processar isso.';
      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the hub nodes.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-[100]">
      {isOpen ? (
        <div className="w-96 h-[500px] bg-white dark:bg-gray-900 facodi-card flex flex-col shadow-xl dark:shadow-2xl">
          <div className="p-6 bg-black dark:bg-gray-950 text-white flex justify-between items-center border-b border-gray-700">
            <h4 className="text-sm font-bold tracking-tight">Curriculum AI Node</h4>
            <button onClick={() => setIsOpen(false)} className="material-symbols-outlined text-xl hover:text-primary transition-colors" aria-label="Close navigator">
              close
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="facodi-card facodi-card-elevated p-4 text-sm font-medium">
              Hello. I am the FACODI Navigator. Ask me anything about the LESTI curriculum or your learning path.
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 text-sm font-medium rounded-lg ${
                  m.role === 'user'
                    ? 'facodi-primary-surface'
                    : 'facodi-card border-l-4 border-primary'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="facodi-spinner"></div>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask assistant..."
              className="facodi-input flex-1 text-sm"
            />
            <button type="submit" disabled={isLoading} className="facodi-btn facodi-btn-primary px-4">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-black text-white stark-border flex items-center justify-center facodi-hover-primary-ink transition-all shadow-[10px_10px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span className="material-symbols-outlined text-3xl">smart_toy</span>
        </button>
      )}
    </div>
  );
};

export default AINavigator;
