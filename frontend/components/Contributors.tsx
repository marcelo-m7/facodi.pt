
import React from 'react';

const CONTRIBUTORS = [
  { name: "Monynha Softwares", role: "Founding Organization", location: "Portugal", impact: "Infrastructure & Vision" },
  { name: "ISE UAlg", role: "Academic Partner", location: "Algarve", impact: "Scientific Validation" },
  { name: "FACODI Core Team", role: "Content Curation", location: "Remote", impact: "Curriculum Design" },
  { name: "Open Source Guild", role: "Development", location: "Global", impact: "Web Platform & UI" },
  { name: "Alumni Network", role: "Mentorship", location: "Hybrid", impact: "Community Support" },
];

const Contributors: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-24">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
          The<br/>Community
        </h1>
        <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
          FACODI is built and maintained by a borderless network of developers and educators.
        </p>
      </div>

      <div className="stark-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.3em]">
              <th className="px-8 py-6">Contributor</th>
              <th className="px-8 py-6">Role</th>
              <th className="px-8 py-6 hidden md:table-cell">Location</th>
              <th className="px-8 py-6 text-right">Primary Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {CONTRIBUTORS.map((c, idx) => (
              <tr key={idx} className="hover:bg-primary transition-colors group cursor-default">
                <td className="px-8 py-8 font-black uppercase text-lg tracking-tighter">{c.name}</td>
                <td className="px-8 py-8 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">{c.role}</td>
                <td className="px-8 py-8 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black hidden md:table-cell">{c.location}</td>
                <td className="px-8 py-8 text-right font-bold uppercase text-xs tracking-widest">{c.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-24 bg-brand-muted p-12 lg:p-24 text-center stark-border">
        <h3 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-8 italic">Want to help shape the future?</h3>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-12 uppercase text-xs tracking-[0.2em] leading-loose">
          We are always looking for curriculum experts, software engineers, and community leads to join our mission.
        </p>
        <button className="bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-black transition-all">
          Join the GitHub Organization
        </button>
      </div>
    </div>
  );
};

export default Contributors;
