
import React from 'react';
import { CurricularUnit, Category } from '../types';

interface DashboardProps {
  savedUnits: CurricularUnit[];
  onUnitClick: (id: string) => void;
  onRemove: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ savedUnits, onUnitClick, onRemove }) => {
  const totalECTS = savedUnits.reduce((acc, unit) => acc + unit.ects, 0);
  const targetECTS = 180;
  const progressPercent = Math.min((totalECTS / targetECTS) * 100, 100);

  const categoryCount = savedUnits.reduce((acc, unit) => {
    // Cast category to string to ensure stable Record key indexing
    const cat = unit.category as string;
    acc[cat] = (acc[cat] || 0) + unit.ects;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-20">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
          Meu<br/>Progresso
        </h1>
        <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
          Acompanhamento dinâmico das suas conquistas académicas na FACODI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="stark-border p-10 bg-black text-white relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-primary">Créditos Acumulados</h4>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-8xl font-black italic">{totalECTS}</span>
              <span className="text-xl font-bold opacity-40">/ {targetECTS} ECTS</span>
            </div>
            <div className="w-full h-4 bg-white/10 stark-border mb-2">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-right opacity-40">
              {progressPercent.toFixed(1)}% do curso concluído
            </p>
          </div>

          <div className="stark-border p-10 bg-brand-muted">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8">Distribuição por Área</h4>
            <div className="space-y-6">
              {Object.entries(categoryCount).map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                    <span>{cat}</span>
                    <span>{count} ECTS</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5">
                    {/* Fixed arithmetic operation error by renaming destructured variable and ensuring type safety with Number() cast */}
                    <div 
                      className="h-full bg-black transition-all" 
                      style={{ width: `${totalECTS > 0 ? (Number(count) / totalECTS) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {savedUnits.length === 0 && (
                <p className="text-xs text-gray-400 italic">Guarde unidades para ver a distribuição.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Saved List */}
        <div className="lg:col-span-8">
          <div className="stark-border bg-white">
            <div className="p-8 border-b border-black flex justify-between items-center bg-black text-white">
              <h3 className="text-xs font-black uppercase tracking-widest">Unidades em Foco ({savedUnits.length})</h3>
              <button className="text-[9px] font-black uppercase tracking-widest hover:text-primary underline">Exportar Plano</button>
            </div>
            
            <div className="divide-y divide-black/10">
              {savedUnits.map(unit => (
                <div key={unit.id} className="p-8 hover:bg-brand-muted transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                  <div className="cursor-pointer flex-1" onClick={() => onUnitClick(unit.id)}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 uppercase">{unit.id}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{unit.courseId}</span>
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tighter group-hover:text-primary group-hover:bg-black px-1 transition-all inline-block">
                      {unit.name}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-gray-400">Status</p>
                      <p className="text-[10px] font-bold uppercase text-green-600">A Estudar</p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-[9px] font-black uppercase text-gray-400">Créditos</p>
                      <p className="text-[10px] font-bold">{unit.ects} ECTS</p>
                    </div>
                    <button 
                      onClick={() => onRemove(unit.id)}
                      className="w-10 h-10 stark-border flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {savedUnits.length === 0 && (
                <div className="p-20 text-center opacity-20">
                  <span className="material-symbols-outlined text-6xl mb-4">folder_open</span>
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Nenhuma unidade guardada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
