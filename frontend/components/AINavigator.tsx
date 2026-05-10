
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
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the hub nodes.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100]">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] sm:w-96 max-w-[24rem] h-[min(70vh,500px)] bg-white stark-border flex flex-col shadow-[12px_12px_0px_0px_#000000] sm:shadow-[20px_20px_0px_0px_#000000]">
          <div className="p-4 sm:p-6 bg-black text-white flex justify-between items-center gap-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Curriculum AI Node</h4>
            <button onClick={() => setIsOpen(false)} className="material-symbols-outlined text-xl hover:text-primary transition-colors">close</button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="bg-brand-muted p-4 text-[11px] font-bold uppercase tracking-wide leading-relaxed">
              Hello. I am the FACODI Navigator. Ask me anything about the LESTI curriculum or your learning path.
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 text-xs font-medium ${m.role === 'user' ? 'bg-primary stark-border uppercase tracking-wider' : 'bg-white border-l-4 border-black'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="animate-pulse text-[10px] font-black uppercase tracking-widest text-gray-400">Processing Node...</div>
            )}
          </div>

          <form onSubmit={handleAsk} className="p-3 sm:p-4 border-t border-black/10 flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ASK ASSISTANT..."
              className="flex-1 min-w-0 bg-brand-muted stark-border px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] font-bold uppercase outline-none focus:border-primary"
            />
            <button type="submit" className="bg-black text-white px-4 sm:px-6 hover:bg-primary hover:text-black transition-all">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 sm:w-16 sm:h-16 bg-black text-white stark-border flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-[8px_8px_0px_0px_#000000] sm:shadow-[10px_10px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span className="material-symbols-outlined text-2xl sm:text-3xl">smart_toy</span>
        </button>
      )}
    </div>
  );
};

export default AINavigator;
