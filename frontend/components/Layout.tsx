
import React from 'react';
import { Locale } from '../data/i18n';

type View = 'home' | 'courses' | 'repository' | 'paths' | 'roadmap' | 'contributors' | 'playlists' | 'dashboard' | 'course-detail';

interface Props {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  savedCount: number;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  t: (key: string) => string;
}

const Layout: React.FC<Props> = ({
  children,
  currentView,
  onViewChange,
  savedCount,
  locale,
  onLocaleChange,
  isDark,
  onToggleTheme,
  t
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white stark-border-b h-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-12 lg:gap-24">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => onViewChange('home')}
            >
              <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">FACODI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-[10px] font-bold uppercase tracking-widest">
              <button 
                onClick={() => onViewChange('home')}
                className={`transition-all ${currentView === 'home' ? 'text-black font-black' : 'text-gray-400 hover:text-black'}`}
              >
                {t('nav.home')}
              </button>
              <button 
                onClick={() => onViewChange('courses')}
                className={`transition-all ${currentView === 'courses' ? 'text-black font-black' : 'text-gray-400 hover:text-black'}`}
              >
                {t('nav.courses')}
              </button>
              <button 
                onClick={() => onViewChange('repository')}
                className={`transition-all ${['repository', 'course-detail'].includes(currentView) ? 'text-black font-black' : 'text-gray-400 hover:text-black'}`}
              >
                {t('nav.units')}
              </button>
              <button 
                onClick={() => onViewChange('roadmap')}
                className={`transition-all ${currentView === 'roadmap' ? 'text-black font-black' : 'text-gray-400 hover:text-black'}`}
              >
                {t('nav.roadmap')}
              </button>
              <button 
                onClick={() => onViewChange('dashboard')}
                className={`transition-all relative ${currentView === 'dashboard' ? 'text-black font-black' : 'text-gray-400 hover:text-black'}`}
              >
                {t('nav.progress')}
                {savedCount > 0 && (
                  <span className="absolute -top-3 -right-3 bg-primary text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center stark-border">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 border border-black/10 px-4 py-2 text-[10px] font-bold uppercase">
              <label htmlFor="facodi-language" className="sr-only">{t('nav.languageLabel')}</label>
              <select
                id="facodi-language"
                value={locale}
                onChange={(event) => onLocaleChange(event.target.value as Locale)}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </div>
            <button
              onClick={onToggleTheme}
              aria-label={t('nav.themeToggle')}
              className="stark-border w-10 h-10 flex items-center justify-center hover:bg-brand-muted transition-all"
            >
              <span className="material-symbols-outlined text-lg">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button 
              onClick={() => onViewChange('courses')}
              className="bg-primary text-black px-6 py-2.5 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-nowrap"
            >
              {t('nav.exploreTracks')}
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="bg-white border-t-2 border-black pt-20 pb-10 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <h3 className="text-xl font-black tracking-tighter uppercase mb-8">FACODI — FACULDADE COMUNITÁRIA DIGITAL</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-loose uppercase tracking-[0.1em] max-w-sm mb-8">
                Currículos oficiais com playlists abertas, progresso comunitário e orgulho Monynha Softwares.
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Conteúdo disponível sob licença aberta e amor comunitário.</p>
              <div className="flex gap-4 mt-8">
                <div className="w-10 h-10 stark-border flex items-center justify-center hover:bg-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg">share</span>
                </div>
                <div className="w-10 h-10 stark-border flex items-center justify-center hover:bg-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-lg">code</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">NAVEGAÇÃO</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                <li><button onClick={() => onViewChange('home')} className="hover:text-primary">Início</button></li>
                <li><button onClick={() => onViewChange('repository')} className="hover:text-primary">Cursos</button></li>
                <li><button onClick={() => onViewChange('roadmap')} className="hover:text-primary">Roadmap</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">COMUNIDADE</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                <li><a href="#" className="hover:text-primary">GitHub</a></li>
                <li><a href="#" className="hover:text-primary">Monynha Softwares</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="bg-brand-muted p-8 stark-border flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-2xl">monitoring</span>
                   <p className="text-[10px] font-black uppercase">Monynha Softwares</p>
                </div>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider text-gray-500">
                   FACODI IS PART OF THE MONYNHA SOFTWARES OPEN ECOSYSTEM, PROMOTING ACCESSIBLE TECH FOR THE GLOBAL SOUTH.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">© 2026 MONYNHA SOFTWARES. CONSTRUÍDO COM CARINHO PELA COMUNIDADE FACODI.</p>
            <div className="flex gap-8 text-[9px] font-bold uppercase tracking-[0.4em]">
              <a href="#" className="hover:text-primary">PRIVACIDADE</a>
              <a href="#" className="hover:text-primary">TERMOS</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
