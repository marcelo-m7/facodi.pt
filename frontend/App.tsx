
import React, { Suspense, useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import CourseCard from './components/CourseCard';
import PlaylistCard from './components/PlaylistCard';
import Courses from './components/Courses';
import { Category, Course, CurricularUnit, FilterState, Playlist } from './types';
import { createTranslator, Locale } from './data/i18n';
import { CatalogSource, loadCatalogData } from './services/catalogSource';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabase';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const CourseDetail = React.lazy(() => import('./components/CourseDetail'));
const Contributors = React.lazy(() => import('./components/Contributors'));
const LessonDetail = React.lazy(() => import('./components/LessonDetail'));
const InstitutionalPage = React.lazy(() => import('./components/InstitutionalPage'));
const AINavigator = React.lazy(() => import('./components/AINavigator'));
const VideoDetail = React.lazy(() => import('./components/videos/VideoDetail'));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal'));
const ProfilePage = React.lazy(() => import('./components/user/ProfilePage'));

type View =
  | 'home'
  | 'courses'
  | 'repository'
  | 'paths'
  | 'contributors'
  | 'course-detail'
  | 'lesson-detail'
  | 'playlists'
  | 'dashboard'
  | 'institutional-page'
  | 'videos'
  | 'video-detail'
  | 'profile';

const App: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [savedUnitIds, setSavedUnitIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>('pt');
  const [isDark, setIsDark] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<CurricularUnit[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('mock');
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [enableAiNavigator, setEnableAiNavigator] = useState(false);
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

  const updateRoute = (view: View, unitId?: string | null, lessonId?: string | null, videoId?: string | null) => {
    let path = '/';
    if (view === 'courses') path = '/courses';
    if (view === 'repository') path = '/courses/units';
    if (view === 'course-detail' && unitId) path = `/courses/units/${unitId}`;
    if (view === 'lesson-detail' && lessonId) path = `/lessons/${lessonId}`;
    if (view === 'videos') path = '/videos';
    if (view === 'video-detail' && videoId) path = `/videos/${videoId}`;
    if (view === 'dashboard') path = '/dashboard';
    if (view === 'playlists') path = '/playlists';
    if (view === 'contributors') path = '/contributors';
    if (view === 'profile') path = '/profile';
    if (view === 'institutional-page' && unitId) path = `/${unitId}`;
    window.history.pushState({}, '', path);
  };

  const syncViewWithLocation = () => {
    const path = window.location.pathname;
    if (path.startsWith('/videos/')) {
      const videoId = path.replace('/videos/', '').split('/')[0];
      if (videoId) {
        setSelectedVideoId(videoId);
        setCurrentView('video-detail');
        return;
      }
    }
    if (path.startsWith('/videos')) {
      setCurrentView('videos');
      return;
    }
    if (path.startsWith('/lessons/')) {
      const lessonId = path.replace('/lessons/', '').split('/')[0];
      const lessonExists = units.some(unit => unit.id === lessonId);
      if (lessonExists) {
        setSelectedLessonId(lessonId);
        setCurrentView('lesson-detail');
        return;
      }
    }
    if (path.startsWith('/courses/units/')) {
      const unitId = path.replace('/courses/units/', '').split('/')[0];
      const unitExists = units.some(unit => unit.id === unitId);
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
    if (path === '/profile') {
      setCurrentView('profile');
      return;
    }
    // Institutional pages: /manifesto, /sobre, /comunidade, /roadmap, /infraestrutura, /como-contribuir
    const INSTITUTIONAL_SLUGS = ['manifesto', 'sobre', 'comunidade', 'roadmap', 'infraestrutura', 'como-contribuir', 'sobre-marcelo', 'sobre-ualg', 'sobre-open2', 'modelo-academico'];
    const slug = path.replace('/', '');
    if (INSTITUTIONAL_SLUGS.includes(slug)) {
      setSelectedPageSlug(slug);
      setCurrentView('institutional-page');
      return;
    }
    setCurrentView('home');
  };

  useEffect(() => {
    let active = true;
    setIsCatalogLoading(true);

    loadCatalogData()
      .then((payload) => {
        if (!active) return;
        setCourses(payload.courses);
        setUnits(payload.units);
        setPlaylists(payload.playlists);
        setCatalogSource(payload.source);
        setCatalogError(null);
      })
      .catch((error) => {
        if (!active) return;
        setCatalogError(error instanceof Error ? error.message : 'Falha ao sincronizar conteudo do Odoo.');
        setCourses([]);
        setUnits([]);
        setPlaylists([]);
      })
      .finally(() => {
        if (!active) return;
        setIsCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    syncViewWithLocation();
    const handlePop = () => syncViewWithLocation();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [units]);

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

  // Dynamic page title
  useEffect(() => {
    const BASE = 'FACODI';
    const map: Partial<Record<View, string>> = {
      home: `${BASE} — Faculdade Comunitária Digital`,
      courses: `Cursos — ${BASE}`,
      repository: `Unidades Curriculares — ${BASE}`,
      dashboard: `Meu Progresso — ${BASE}`,
      playlists: `Playlists — ${BASE}`,
      videos: `Videos — ${BASE}`,
      contributors: `Contribuidores — ${BASE}`,
    };
    const selectedUnitForTitle = units.find((u) => u.id === selectedUnitId) || null;
    const selectedLessonForTitle = units.find((u) => u.id === selectedLessonId) || null;
    if (currentView === 'course-detail' && selectedUnitForTitle) {
      document.title = `${selectedUnitForTitle.name} — ${BASE}`;
    } else if (currentView === 'lesson-detail' && selectedLessonForTitle) {
      document.title = `${selectedLessonForTitle.name} — ${BASE}`;
    } else if (currentView === 'video-detail' && selectedVideoId) {
      document.title = `Video ${selectedVideoId} — ${BASE}`;
    } else if (currentView === 'institutional-page' && selectedPageSlug) {
      const slugLabels: Record<string, string> = {
        manifesto: 'Manifesto',
        sobre: 'Sobre a FACODI',
        'sobre-marcelo': 'Marcelo Santos',
        'sobre-ualg': 'Universidade do Algarve',
        'sobre-open2': 'Open2 Technology',
        comunidade: 'Comunidade Corvanis',
        roadmap: 'Roadmap',
        'modelo-academico': 'Modelo Académico',
        infraestrutura: 'Infraestrutura',
        'como-contribuir': 'Como Contribuir',
      };
      document.title = `${slugLabels[selectedPageSlug] ?? selectedPageSlug} — ${BASE}`;
    } else {
      document.title = map[currentView] ?? BASE;
    }
  }, [currentView, selectedPageSlug, selectedUnitId, selectedLessonId, selectedVideoId, units]);

  // Dynamic SEO meta tags for SPA routes
  useEffect(() => {
    const siteUrl = 'https://facodi.open2.tech';
    const defaultDescription = 'Curriculos universitarios abertos com playlists, progresso comunitario e materiais livres para todos.';

    const selectedUnitForSeo = units.find((u) => u.id === selectedUnitId) || null;
    const selectedLessonForSeo = units.find((u) => u.id === selectedLessonId) || null;

    const slugMeta: Record<string, { title: string; description: string }> = {
      manifesto: {
        title: 'Manifesto - FACODI',
        description: 'Conheca a visao da FACODI para ensino superior aberto, comunitario e remixavel.',
      },
      sobre: {
        title: 'Sobre a FACODI',
        description: 'Entenda a origem da FACODI e o contexto institucional da iniciativa.',
      },
      'sobre-marcelo': {
        title: 'Marcelo Santos - FACODI',
        description: 'Perfil do fundador e arquiteto da FACODI e sua visao para educacao aberta.',
      },
      'sobre-ualg': {
        title: 'Universidade do Algarve - FACODI',
        description: 'Relacao institucional entre FACODI e Universidade do Algarve.',
      },
      'sobre-open2': {
        title: 'Open2 Technology - FACODI',
        description: 'Como o ecossistema Open2 Technology sustenta a evolucao tecnica da FACODI.',
      },
      comunidade: {
        title: 'Comunidade Corvanis - FACODI',
        description: 'Descubra como participar da comunidade que constroi e cura a FACODI.',
      },
      roadmap: {
        title: 'Roadmap - FACODI',
        description: 'Prioridades de curto, medio e longo prazo para a evolucao da FACODI.',
      },
      'modelo-academico': {
        title: 'Modelo Academico - FACODI',
        description: 'Estrutura academica da FACODI: cursos, unidades curriculares, playlists e recursos abertos.',
      },
      infraestrutura: {
        title: 'Infraestrutura Tecnica - FACODI',
        description: 'Arquitetura tecnica da plataforma FACODI com React, Supabase e integracoes.',
      },
      'como-contribuir': {
        title: 'Como Contribuir - FACODI',
        description: 'Guia para contribuir com conteudo, codigo, traducao e curadoria na FACODI.',
      },
    };

    const viewMeta: Record<View, { path: string; title: string; description: string }> = {
      home: {
        path: '/',
        title: 'FACODI - Faculdade Comunitaria Digital',
        description: defaultDescription,
      },
      courses: {
        path: '/courses',
        title: 'Cursos - FACODI',
        description: 'Explore licenciaturas e percursos com curriculos oficiais e recursos abertos.',
      },
      repository: {
        path: '/courses/units',
        title: 'Unidades Curriculares - FACODI',
        description: 'Navegue por unidades curriculares com ementa, contexto e playlists integradas.',
      },
      paths: {
        path: '/courses/units',
        title: 'Trilhas - FACODI',
        description: defaultDescription,
      },
      contributors: {
        path: '/contributors',
        title: 'Contribuidores - FACODI',
        description: 'Conheca as pessoas e comunidades que constroem a FACODI.',
      },
      'course-detail': {
        path: selectedUnitForSeo ? `/courses/units/${selectedUnitForSeo.id}` : '/courses/units',
        title: selectedUnitForSeo ? `${selectedUnitForSeo.name} - FACODI` : 'Detalhe de Unidade - FACODI',
        description: selectedUnitForSeo?.description || 'Detalhes da unidade curricular com recursos relacionados.',
      },
      'lesson-detail': {
        path: selectedLessonForSeo ? `/lessons/${selectedLessonForSeo.id}` : '/courses/units',
        title: selectedLessonForSeo ? `${selectedLessonForSeo.name} - FACODI` : 'Licao - FACODI',
        description: selectedLessonForSeo?.description || 'Pagina da licao com conteudo, links e videos da playlist.',
      },
      playlists: {
        path: '/playlists',
        title: 'Playlists - FACODI',
        description: 'Colecoes de playlists organizadas para apoiar o estudo por unidade curricular.',
      },
      videos: {
        path: '/videos',
        title: 'Videos - FACODI',
        description: 'Colecao de videos educacionais organizados por playlists e contexto curricular.',
      },
      'video-detail': {
        path: selectedVideoId ? `/videos/${selectedVideoId}` : '/videos',
        title: selectedVideoId ? `Video ${selectedVideoId} - FACODI` : 'Video - FACODI',
        description: 'Visualizacao detalhada de video com relacao a trilhas e unidade curricular.',
      },
      dashboard: {
        path: '/dashboard',
        title: 'Meu Progresso - FACODI',
        description: 'Acompanhe unidades guardadas e progresso de estudo na FACODI.',
      },
      'institutional-page': {
        path: selectedPageSlug ? `/${selectedPageSlug}` : '/',
        title: selectedPageSlug ? (slugMeta[selectedPageSlug]?.title || 'Pagina Institucional - FACODI') : 'FACODI',
        description: selectedPageSlug ? (slugMeta[selectedPageSlug]?.description || defaultDescription) : defaultDescription,
      },
      profile: {
        path: '/profile',
        title: 'Meu Perfil - FACODI',
        description: 'Perfil do utilizador na FACODI com favoritos e progresso de estudo.',
      },
    };

    const { path, title, description } = viewMeta[currentView];
    const fullUrl = `${siteUrl}${path}`;

    const setMeta = (selector: string, value: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', value);
      }
    };

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', fullUrl);
    }

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', fullUrl);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
  }, [currentView, selectedPageSlug, selectedUnitId, selectedLessonId, selectedVideoId, units]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('facodi_theme', isDark ? 'dark' : 'light');
    document.body.classList.toggle('bg-black', isDark);
    document.body.classList.toggle('text-white', isDark);
    document.body.classList.toggle('bg-white', !isDark);
    document.body.classList.toggle('text-black', !isDark);
  }, [isDark]);

  useEffect(() => {
    let timeoutId: number | null = null;
    const schedule = () => setEnableAiNavigator(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(schedule);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    timeoutId = window.setTimeout(schedule, 900);
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const lazyFallback = (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
      <div className="stark-border bg-brand-muted p-6 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3">
        <span className="material-symbols-outlined animate-pulse">hourglass_top</span>
        A carregar...
      </div>
    </div>
  );

  const toggleSave = (id: string) => {
    const newSaved = savedUnitIds.includes(id)
      ? savedUnitIds.filter(sid => sid !== id)
      : [...savedUnitIds, id];
    setSavedUnitIds(newSaved);
    localStorage.setItem('facodi_saved', JSON.stringify(newSaved));

    // Sync to Supabase if logged in (unit_code = id for mock source, or unitCode field)
    if (user) {
      const unitCode = units.find(u => u.id === id)?.unitCode ?? id;
      if (newSaved.includes(id)) {
        supabase.from('unit_favorites').upsert({ user_id: user.id, unit_code: unitCode }, { onConflict: 'user_id,unit_code' }).then(({ error }) => {
          if (error) console.warn('[toggleSave] upsert error:', error.message);
        });
      } else {
        supabase.from('unit_favorites').delete().eq('user_id', user.id).eq('unit_code', unitCode).then(({ error }) => {
          if (error) console.warn('[toggleSave] delete error:', error.message);
        });
      }
    }
  };

  const categories = ['All', ...Object.values(Category)];
  const years = ['All', 1, 2, 3];
  const semesters = ['All', 1, 2, 3, 4, 5, 6];

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId) || null, [selectedUnitId, units]);
  const savedUnits = useMemo(() => units.filter(u => savedUnitIds.includes(u.id)), [savedUnitIds, units]);
  const selectedLesson = useMemo(() => units.find(u => u.id === selectedLessonId) || null, [selectedLessonId, units]);
  const coursesById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const selectedCourse = useMemo(
    () => (filters.courseId === 'All' ? null : (coursesById.get(filters.courseId) ?? null)),
    [filters.courseId, coursesById],
  );

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
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
  }, [filters, savedUnitIds, units]);

  const clearFilters = () => {
    setFilters({ category: 'All', difficulty: 'All', search: '', onlySaved: false, courseId: 'All', year: 'All', semester: 'All' });
  };

  const handleUnitSelect = (id: string) => {
    setSelectedUnitId(id);
    setCurrentView('course-detail');
    updateRoute('course-detail', id);
  };

  const handleLessonSelect = (id: string) => {
    setSelectedLessonId(id);
    setCurrentView('lesson-detail');
    updateRoute('lesson-detail', undefined, id);
  };

  const handlePageNavigate = (slug: string) => {
    setSelectedPageSlug(slug);
    setCurrentView('institutional-page');
    updateRoute('institutional-page', slug);
  };

  const handleVideoSelect = (id: string) => {
    setSelectedVideoId(id);
    setCurrentView('video-detail');
    updateRoute('video-detail', undefined, undefined, id);
  };

  const renderContent = () => {
    if (currentView === 'profile') {
      return (
        <Suspense fallback={lazyFallback}>
          <ProfilePage
            onBack={() => { setCurrentView('home'); updateRoute('home'); }}
            t={t}
          />
        </Suspense>
      );
    }

    if (currentView === 'course-detail' && selectedUnit) {
      return (
        <Suspense fallback={lazyFallback}>
          <CourseDetail
            unit={selectedUnit}
            allUnits={units}
            playlists={playlists}
            onBack={() => {
              setCurrentView('repository');
              updateRoute('repository');
            }}
            onNavigate={handleUnitSelect}
            t={t}
              courseTitle={coursesById.get(selectedUnit.courseId)?.title}
          />
        </Suspense>
      );
    }

    if (currentView === 'institutional-page' && selectedPageSlug) {
      return (
        <Suspense fallback={lazyFallback}>
          <InstitutionalPage
            slug={selectedPageSlug}
            locale={locale}
            onBack={() => {
              setCurrentView('home');
              updateRoute('home');
            }}
          />
        </Suspense>
      );
    }

    if (currentView === 'lesson-detail' && selectedLesson) {
      return (
        <Suspense fallback={lazyFallback}>
          <LessonDetail
            unit={selectedLesson}
            allUnits={units}
            playlists={playlists}
            onBack={() => {
              setCurrentView('repository');
              updateRoute('repository');
            }}
            onNavigate={handleLessonSelect}
            t={t}
              courseTitle={coursesById.get(selectedLesson.courseId)?.title}
          />
        </Suspense>
      );
    }

    if (currentView === 'video-detail' && selectedVideoId) {
      return (
        <Suspense fallback={lazyFallback}>
          <VideoDetail
            videoId={selectedVideoId}
            onBack={() => {
              setCurrentView('videos');
              updateRoute('videos');
            }}
            onSelectVideo={handleVideoSelect}
            t={t}
          />
        </Suspense>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Suspense fallback={lazyFallback}>
            <Dashboard
              savedUnits={savedUnits}
              onUnitClick={handleUnitSelect}
              onRemove={toggleSave}
            />
          </Suspense>
        );
      case 'home':
        return (
          <Home
            onExplore={() => {
              setCurrentView('courses');
              updateRoute('courses');
            }}
            onNavigatePage={handlePageNavigate}
            onSelectCourse={(courseId) => {
              setFilters((f) => ({ ...f, courseId }));
              setCurrentView('repository');
              updateRoute('repository');
            }}
            t={t}
            courses={courses}
            units={units}
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
            courses={courses}
            units={units}
            isLoading={isCatalogLoading}
          />
        );
      case 'contributors':
        return (
          <Suspense fallback={lazyFallback}>
            <Contributors />
          </Suspense>
        );
      case 'playlists':
        return (
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">Playlists</h1>
            {catalogError && (
              <p className="text-xs uppercase tracking-widest text-red-600 mb-8">{catalogError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} onSelect={() => {}} />)}
            </div>
            {!playlists.length && (
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-10">Sem playlists mapeadas no conteudo sincronizado.</p>
            )}
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
                    <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
                      Explore {units.length} unidades de conhecimento.
                      <span className="ml-2 text-xs uppercase tracking-widest text-gray-400">Fonte: {catalogSource}</span>
                    </p>
                    {selectedCourse && (
                      <div className="mt-8 stark-border bg-brand-muted p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">Curso selecionado</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{selectedCourse.title}</h2>
                        <p className="text-xs text-gray-600 mt-2">
                          {filteredUnits.length} unidades associadas a {selectedCourse.id}.
                        </p>
                      </div>
                    )}
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
                        {courses.map(d => <button key={d.id} onClick={() => setFilters(f => ({ ...f, courseId: d.id }))} className={`px-3 py-2 text-[10px] font-bold uppercase text-left ${filters.courseId === d.id ? 'bg-primary stark-border' : 'text-gray-400 hover:text-black'}`}>{d.id}</button>)}
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
                          <CourseCard
                            unit={unit}
                            onClick={handleLessonSelect}
                            courseTitle={coursesById.get(unit.courseId)?.title}
                          />
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
      onNavigatePage={handlePageNavigate}
      savedCount={savedUnitIds.length}
      locale={locale}
      onLocaleChange={setLocale}
      isDark={isDark}
      onToggleTheme={() => setIsDark(prev => !prev)}
      t={t}
      onOpenAuth={() => setShowAuthModal(true)}
    >
      {renderContent()}
      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setShowAuthModal(false)} t={t} />
        </Suspense>
      )}
      {enableAiNavigator && (
        <Suspense fallback={null}>
          <AINavigator units={units} />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;
