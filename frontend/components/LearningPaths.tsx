
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
    <div className="facodi-page max-w-[1600px] mx-auto">
      <div className="mb-16">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.95] mb-6">
          Learning Paths
        </h1>
        <p className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400 max-w-3xl">
          Specialized curriculum tracks designed for high-impact professional outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {PATHS.map((path, idx) => (
          <div key={idx} className="facodi-card facodi-card-interactive p-8 flex flex-col transition-all duration-240">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <span className="facodi-badge facodi-badge-neon">
                Path {idx + 1}
              </span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {path.ects} ECTS
              </span>
            </div>
            
            <h3 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
              {path.title}
            </h3>
            
            <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {path.description}
            </p>

            <div className="mt-auto pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <p className="facodi-label">Core Modules</p>
              <ul className="space-y-3">
                {path.units.map(unit => (
                  <li key={unit} className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="material-symbols-outlined text-base text-primary flex-shrink-0">check_circle</span>
                    <span>{unit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button className="mt-12 w-full facodi-btn facodi-btn-primary">
              Enroll in Track
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPaths;
