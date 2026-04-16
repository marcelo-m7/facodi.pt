
import React from 'react';

const PATHS = [
  {
    title: "Artificial Intelligence Architect",
    ects: 45,
    difficulty: "Advanced",
    units: ["Aprendizagem Automática", "Inteligência Artificial", "Análise de Dados", "Bases de Dados II"],
    description: "Master the lifecycle of intelligent systems from raw data collection to advanced neural deployment."
  },
  {
    title: "Full-Stack Software Engineer",
    ects: 60,
    difficulty: "Intermediate",
    units: ["Tecnologias Web", "Engenharia de Software", "Desenvolvimento Web Avançado", "Cibersegurança"],
    description: "Build resilient, secure, and scalable modern web applications using professional agile workflows."
  },
  {
    title: "Cyber-Physical Systems Lead",
    ects: 50,
    difficulty: "Expert",
    units: ["Sistemas Operativos", "Microprocessadores", "Redes de Computadores", "Cibersegurança"],
    description: "Focus on the intersection of hardware and software, securing the infrastructure of the future."
  }
];

const LearningPaths: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-20">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
          Learning<br/>Paths
        </h1>
        <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
          Specialized curriculum tracks designed for high-impact professional outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PATHS.map((path, idx) => (
          <div key={idx} className="stark-border bg-white p-10 hover:bg-black hover:text-white transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-12">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-primary text-black px-3 py-1.5">
                Path {idx + 1}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">
                {path.ects} ECTS
              </span>
            </div>
            
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 leading-tight">
              {path.title}
            </h3>
            
            <p className="text-sm font-medium opacity-60 mb-10 leading-relaxed">
              {path.description}
            </p>

            <div className="mt-auto pt-8 border-t border-black/10 group-hover:border-white/20">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-primary">Core Modules</p>
              <ul className="space-y-3">
                {path.units.map(unit => (
                  <li key={unit} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                    {unit}
                  </li>
                ))}
              </ul>
            </div>
            
            <button className="mt-12 w-full py-4 stark-border border-black group-hover:border-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all">
              Enroll in Track
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPaths;
