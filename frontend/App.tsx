
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import CourseCard from './components/CourseCard';
import CourseDetail from './components/CourseDetail';
import Roadmap from './components/Roadmap';
import Contributors from './components/Contributors';
import PlaylistCard from './components/PlaylistCard';
import AINavigator from './components/AINavigator';
import Courses from './components/Courses';
import { COURSE_UNITS } from './data/courses';
import { PLAYLISTS } from './data/playlists';
import { DEGREES } from './data/degrees';
import { Category, Difficulty, FilterState } from './types';
import { createTranslator, Locale } from './data/i18n';

type View = 'home' | 'courses' | 'repository' | 'paths' | 'roadmap' | 'contributors' | 'course-detail' | 'playlists' | 'dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [savedUnitIds, setSavedUnitIds] = useState<string[]>([]);
  const [locale, setLocale] = useState<Locale>('pt');
  const [isDark, setIsDark] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    difficulty: 'All',
    search: '',
    onlySaved: false,
    courseId: 'All',
    year: 'All',
    semester: 'All'
  });

  const t = useMemo(() => createTranslator(locale), [locale]);

  const updateRoute = (view: View, unitId?: string | null) => {
    let path = '/';
    if (view === 'courses') path = '/courses';
    if (view === 'repository') path = '/courses/units';
    if (view === 'course-detail' && unitId) path = `/courses/units/${unitId}`;
    if (view === 'roadmap') path = '/roadmap';
    if (view === 'dashboard') path = '/dashboard';
    if (view === 'playlists') path = '/playlists';
    if (view === 'contributors') path = '/contributors';
    window.history.pushState({}, '', path);
  };

  const syncViewWithLocation = () => {
    const path = window.location.pathname;
    if (path.startsWith('/courses/units/')) {
      const unitId = path.replace('/courses/units/', '').split('/')[0];
      const unitExists = COURSE_UNITS.some(unit => unit.id === unitId);
      if (unitExists) {
        setSelectedUnitId(unitId);
        setCurrentView('course-detail');
        return;
      }
    }
    if (path.startsWith('/courses/units')) {
      setCurrentView('repository');
      return;
    }
    if (path.startsWith('/courses')) {
      setCurrentView('courses');
      return;
    }
    if (path.startsWith('/roadmap')) {
      setCurrentView('roadmap');
      return;
    }
    if (path.startsWith('/dashboard')) {
      setCurrentView('dashboard');
      return;
    }
    if (path.startsWith('/playlists')) {
      setCurrentView('playlists');
      return;
    }
    if (path.startsWith('/contributors')) {
      setCurrentView('contributors');
      return;
    }
    setCurrentView('home');
  };

  useEffect(() => {
    syncViewWithLocation();
    const handlePop = () => syncViewWithLocation();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedUnitId]);

  useEffect(() => {
    const saved = localStorage.getItem('facodi_saved');
    if (saved) setSavedUnitIds(JSON.parse(saved));
    const storedLocale = localStorage.getItem('facodi_locale');
    if (storedLocale === 'pt' || storedLocale === 'en') {
      setLocale(storedLocale);
    }
    const storedTheme = localStorage.getItem('facodi_theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('facodi_locale', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('facodi_theme', isDark ? 'dark' : 'light');
    document.body.classList.toggle('bg-black', isDark);
    document.body.classList.toggle('text-white', isDark);
    document.body.classList.toggle('bg-white', !isDark);
    document.body.classList.toggle('text-black', !isDark);
  }, [isDark]);

  const toggleSave = (id: string) => {
    const newSaved = savedUnitIds.includes(id) 
      ? savedUnitIds.filter(sid => sid !== id)
      : [...savedUnitIds, id];
    setSavedUnitIds(newSaved);
    localStorage.setItem('facodi_saved', JSON.stringify(newSaved));
  };

  const categories = ['All', ...Object.values(Category)];
  const years = ['All', 1, 2, 3];
  const semesters = ['All', 1, 2, 3, 4, 5, 6];

  const selectedUnit = useMemo(() => COURSE_UNITS.find(u => u.id === selectedUnitId) || null, [selectedUnitId]);
  const savedUnits = useMemo(() => COURSE_UNITS.filter(u => savedUnitIds.includes(u.id)), [savedUnitIds]);

  const filteredUnits = useMemo(() => {
    return COURSE_UNITS.filter(unit => {
      const matchesSearch = unit.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          unit.tags.some(t => t.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesCategory = filters.category === 'All' || unit.category === filters.category;
      const matchesDifficulty = filters.difficulty === 'All' || unit.difficulty === filters.difficulty;
      const matchesSaved = !filters.onlySaved || savedUnitIds.includes(unit.id);
      const matchesCourse = filters.courseId === 'All' || unit.courseId === filters.courseId;
      const matchesYear = filters.year === 'All' || unit.year === Number(filters.year);
      const matchesSemester = filters.semester === 'All' || unit.semester === Number(filters.semester);
      return matchesSearch && matchesCategory && matchesDifficulty && matchesSaved && matchesCourse && matchesYear && matchesSemester;
    });
  }, [filters, savedUnitIds]);

  const clearFilters = () => {
    setFilters({ category: 'All', difficulty: 'All', search: '', onlySaved: false, courseId: 'All', year: 'All', semester: 'All' });
  };

  const handleUnitSelect = (id: string) => {
    setSelectedUnitId(id);
    setCurrentView('course-detail');
    updateRoute('course-detail', id);
  };

  const renderContent = () => {
    if (currentView === 'course-detail' && selectedUnit) {
      return <CourseDetail 
                unit={selectedUnit} 
                onBack={() => {
                  setCurrentView('repository');
                  updateRoute('repository');
                }} 
                onNavigate={handleUnitSelect}
                t={t}
             />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            savedUnits={savedUnits} 
            onUnitClick={handleUnitSelect}
            onRemove={toggleSave}
          />
        );
      case 'home':
        return (
          <Home
            onExplore={() => {
              setCurrentView('courses');
              updateRoute('courses');
            }}
            onRoadmap={() => {
              setCurrentView('roadmap');
              updateRoute('roadmap');
            }}
            t={t}
          />
        );
      case 'courses':
        return (
          <Courses
            onSelectCourse={(courseId) => {
              setFilters(f => ({ ...f, courseId }));
              setCurrentView('repository');
              updateRoute('repository');
            }}
            t={t}
          />
        );
      case 'roadmap': return <Roadmap t={t} />;
      case 'contributors': return <Contributors />;
      case 'playlists':
        return (
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">Playlists</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PLAYLISTS.map(pl => <PlaylistCard key={pl.id} playlist={pl} onSelect={() => {}} />)}
            </div>
          </div>
        );
      case 'repository':
      default:
        return (
          <>
            <section className="bg-white stark-border-b">
              <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 lg:gap-24">
                  <div className="max-w-3xl">
                    <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-8">Unidades</h1>
                    <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">Explore {COURSE_UNITS.length} unidades de conhecimento.</p>
                  </div>
                  <div className="w-full lg:w-[480px] relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-black text-2xl group-focus-within:text-primary transition-colors">search</span>
                    <input 
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      className="w-full bg-white stark-border px-14 py-5 text-sm font-bold uppercase tracking-widest outline-none transition-all focus:shadow-[6px_6px_0px_0px_rgba(239,255,0,1)]"
                      placeholder="PESQUISAR..."
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
              <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
                <aside className="w-full lg:w-72 shrink-0 space-y-12">
                  <div className="sticky top-32 space-y-12">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Curso</h3>
                      <div className="flex flex-wrap lg:flex-col gap-1">
                        <button onClick={() => setFilters(f => ({ ...f, courseId: 'All' }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.courseId === 'All' ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>Todos</button>
                        {DEGREES.map(d => <button key={d.id} onClick={() => setFilters(f => ({ ...f, courseId: d.id }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.courseId === d.id ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>{d.id}</button>)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Ano / Semestre</h3>
                      <div className="flex gap-4 mb-4">
                        <select value={filters.year} onChange={(e) => setFilters(f => ({ ...f, year: e.target.value as any }))} className="bg-white stark-border text-[10px] font-black p-2 w-full uppercase cursor-pointer">
                          {years.map(y => <option key={y} value={y}>{y === 'All' ? 'Ano' : `Ano ${y}`}</option>)}
                        </select>
                        <select value={filters.semester} onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value as any }))} className="bg-white stark-border text-[10px] font-black p-2 w-full uppercase cursor-pointer">
                          {semesters.map(s => <option key={s} value={s}>{s === 'All' ? 'Sem' : `S0${s}`}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">Área</h3>
                      <div className="flex flex-wrap lg:flex-col gap-1">
                        {categories.map(cat => <button key={cat} onClick={() => setFilters(f => ({ ...f, category: cat as any }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.category === cat ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>{cat}</button>)}
                      </div>
                    </div>
                    <button onClick={clearFilters} className="w-full stark-border py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">Limpar Filtros</button>
                  </div>
                </aside>

                <section className="flex-1">
                  {filteredUnits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {filteredUnits.map(unit => (
                        <div key={unit.id} className="relative group">
                           <button 
                            onClick={(e) => { e.stopPropagation(); toggleSave(unit.id); }}
                            className={`absolute top-10 right-10 z-10 p-2 transition-all ${savedUnitIds.includes(unit.id) ? 'text-primary' : 'text-gray-300 hover:text-black'}`}
                            title={savedUnitIds.includes(unit.id) ? "Remover dos guardados" : "Guardar no progresso"}
                          >
                            <span className="material-symbols-outlined text-2xl">{savedUnitIds.includes(unit.id) ? 'bookmark' : 'bookmark_add'}</span>
                          </button>
                          <CourseCard unit={unit} onClick={handleUnitSelect} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stark-border bg-brand-muted p-20 text-center">
                      <p className="text-xl font-bold uppercase tracking-tight mb-4 opacity-40">Nenhum resultado nos nós de dados.</p>
                      <button onClick={clearFilters} className="text-white bg-black px-10 py-4 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all">Resetar Filtros</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={(view) => {
        setCurrentView(view);
        updateRoute(view);
      }}
      savedCount={savedUnitIds.length}
      locale={locale}
      onLocaleChange={setLocale}
      isDark={isDark}
      onToggleTheme={() => setIsDark(prev => !prev)}
      t={t}
    >
      {renderContent()}
      <AINavigator />
    </Layout>
  );
};

export default App;
