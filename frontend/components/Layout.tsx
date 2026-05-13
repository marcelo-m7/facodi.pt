
import React, { useEffect, useState } from 'react';
import { Locale } from '../data/i18n';
import { useAuth } from '../contexts/AuthContext';
import DevelopmentBadge from './DevelopmentBadge';
import DevelopmentDisclaimer from './DevelopmentDisclaimer';
import { useDevelopmentNotice } from '../hooks/useDevelopmentNotice';

type View =
  | 'home'
  | 'courses'
  | 'repository'
  | 'paths'
  | 'contributors'
  | 'playlists'
  | 'dashboard'
  | 'course-detail'
  | 'lesson-detail'
  | 'institutional-page'
  | 'videos'
  | 'video-detail'
  | 'profile'
  | 'curator-apply'
  | 'curator-submit'
  | 'curator-submissions'
  | 'curator-channel-pipeline'
  | 'curator-admin-review'
  | 'admin-dashboard'
  | 'admin-contents'
  | 'admin-content-detail'
  | 'admin-curators'
  | 'blog'
  | 'blog-post';

interface Props {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigatePage?: (slug: string) => void;
  onNavigateLegal?: (document: 'privacy-policy' | 'terms-of-service' | 'cookie-policy') => void;
  onOpenCookiePreferences?: () => void;
  allowPreferenceStorage?: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  t: (key: string) => string;
  onOpenAuth: () => void;
}

const Layout: React.FC<Props> = ({
  children,
  currentView,
  onViewChange,
  onNavigatePage,
  onNavigateLegal,
  onOpenCookiePreferences,
  allowPreferenceStorage = true,
  locale,
  onLocaleChange,
  isDark = false,
  onToggleTheme,
  t,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const { isOpen: isDevelopmentOpen, isReady: isDevelopmentReady, closeNotice, openNotice } = useDevelopmentNotice(allowPreferenceStorage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const CONTENT_SUBMIT_URL = 'https://tube.open2.tech';

  const projectLinks = [
    { slug: 'manifesto', label: 'Manifesto', icon: 'flag' },
    { slug: 'sobre', label: 'Sobre a FACODI', icon: 'school' },
    { slug: 'comunidade', label: 'Comunidade Open2', icon: 'groups' },
    { slug: 'roadmap', label: 'Roadmap', icon: 'route' },
    { slug: 'como-contribuir', label: 'Como Contribuir', icon: 'volunteer_activism' },
  ];

  const navGo = (view: View) => { onViewChange(view); setMobileOpen(false); };
  const pageGo = (slug: string) => { onNavigatePage?.(slug); setMobileOpen(false); };
  const isActive = (view: View, extra?: View[]) => currentView === view || (extra?.includes(currentView) ?? false);
  const navCls = (view: View, extra?: View[]) =>
    `facodi-nav-link ${isActive(view, extra) ? 'facodi-nav-link-active' : ''}`;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-black focus:px-4 focus:py-2 focus:font-black focus:text-[10px] focus:uppercase focus:tracking-widest">
        Ir para conteúdo
      </a>

      <header className={`fixed top-0 w-full z-50 h-16 md:h-20 transition-all ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur stark-border-b dark:border-gray-800 shadow-[0_10px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.4)]' : 'bg-white dark:bg-gray-950 stark-border-b dark:border-gray-800'}`}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center justify-between gap-3">
          {/* Logo */}
          <button onClick={() => navGo('home')} aria-label="FACODI — Página inicial" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">
              Beta
            </span>
          </button>

          {/* Desktop nav */}
          <nav aria-label="Navegação principal" className="hidden md:flex flex-1 min-w-0 items-center gap-4 lg:gap-6 overflow-x-auto whitespace-nowrap">
            <button onClick={() => navGo('home')} aria-current={isActive('home') ? 'page' : undefined} className={navCls('home')}>{t('nav.home')}</button>
            <button onClick={() => navGo('courses')} aria-current={isActive('courses') ? 'page' : undefined} className={navCls('courses')}>{t('nav.courses')}</button>
            <button onClick={() => navGo('repository')} aria-current={isActive('repository', ['course-detail', 'lesson-detail']) ? 'page' : undefined} className={navCls('repository', ['course-detail', 'lesson-detail'])}>{t('nav.units')}</button>
            <button onClick={() => navGo('dashboard')} aria-current={isActive('dashboard') ? 'page' : undefined} className={`relative ${navCls('dashboard')}`}>
              {t('nav.progress')}
            </button>
            {user && (
              <button onClick={() => navGo('profile')} aria-current={isActive('profile') ? 'page' : undefined} className={navCls('profile')}>
                {t('nav.profile')}
              </button>
            )}
            {user && (profile?.role === 'editor' || profile?.role === 'admin') && (
              <button onClick={() => navGo('curator-submit')} aria-current={isActive('curator-submit', ['curator-submissions']) ? 'page' : undefined} className={navCls('curator-submit', ['curator-submissions'])}>
                Enviar Conteúdo
              </button>
            )}
            {user && (profile?.role === 'editor' || profile?.role === 'admin') && (
              <button onClick={() => navGo('curator-submissions')} aria-current={isActive('curator-submissions') ? 'page' : undefined} className={navCls('curator-submissions')}>
                Minhas Sugestões
              </button>
            )}
            {user && (profile?.role === 'editor' || profile?.role === 'admin') && (
              <button onClick={() => navGo('curator-channel-pipeline')} aria-current={isActive('curator-channel-pipeline') ? 'page' : undefined} className={navCls('curator-channel-pipeline')}>
                Pipeline de Canal
              </button>
            )}
            {user && profile?.role === 'user' && (
              <button onClick={() => navGo('curator-apply')} aria-current={isActive('curator-apply') ? 'page' : undefined} className={navCls('curator-apply')}>
                Ser Curador
              </button>
            )}
            {user && profile?.role === 'admin' && (
              <button onClick={() => navGo('admin-dashboard')} aria-current={isActive('admin-dashboard', ['admin-contents', 'admin-content-detail', 'admin-curators', 'curator-admin-review']) ? 'page' : undefined} className={navCls('admin-dashboard', ['admin-contents', 'admin-content-detail', 'admin-curators', 'curator-admin-review'])}>
                Painel Admin
              </button>
            )}
            <button onClick={() => navGo('blog')} aria-current={isActive('blog', ['blog-post']) ? 'page' : undefined} className={navCls('blog', ['blog-post'])}>
              {t('nav.blog')}
            </button>
            <button onClick={() => pageGo('manifesto')} className="facodi-nav-link">
              Manifesto
            </button>
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 border border-black/10 dark:border-gray-700 px-3 py-1.5 text-[10px] font-bold uppercase bg-white dark:bg-gray-900 text-black dark:text-white">
              <label htmlFor="facodi-language" className="sr-only">{t('nav.languageLabel')}</label>
              <select id="facodi-language" value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)} className="bg-transparent outline-none cursor-pointer text-black dark:text-white">
                <option value="pt">PT</option>
                <option value="en">EN</option>
              </select>
            </div>
            <button onClick={onToggleTheme} aria-label={t('nav.themeToggle')} className="stark-border dark:border-gray-700 w-11 h-11 flex items-center justify-center hover:bg-brand-muted dark:hover:bg-gray-800 transition-all text-black dark:text-white">
              <span className="material-symbols-outlined text-base">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {user ? (
              <button
                onClick={() => navGo('profile')}
                aria-label="Atalho de perfil"
                className={`stark-border w-11 h-11 flex items-center justify-center hover:bg-brand-muted dark:hover:bg-gray-800 transition-all overflow-hidden ${isActive('profile') ? 'facodi-primary-surface' : 'text-black dark:text-white'}`}
                title={profile?.display_name ?? profile?.username ?? t('nav.profile')}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`Avatar de ${profile?.display_name ?? profile?.username ?? 'utilizador'}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[11px] font-black" aria-hidden="true">{(profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase()}</span>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="stark-border px-4 h-11 text-[10px] font-black uppercase tracking-widest hover:bg-brand-muted dark:hover:bg-gray-800 transition-all"
              >
                {t('nav.login')}
              </button>
            )}
          </div>

          {/* Mobile: bookmark + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => navGo('dashboard')} aria-label="Meu progresso" className="relative w-11 h-11 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">dashboard</span>
            </button>
            <button onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-menu" className="w-10 h-10 flex items-center justify-center stark-border hover:bg-brand-muted dark:hover:bg-gray-800 transition-all text-black dark:text-white">
              <span className="relative block w-5 h-4" aria-hidden="true">
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute left-0 w-5 h-0.5 bg-current transition-all ${mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div className={`fixed inset-0 z-[100] md:hidden bg-black/60 backdrop-blur-sm transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} aria-hidden="true" onClick={() => setMobileOpen(false)} />

      {/* Mobile drawer */}
      <nav
        id="mobile-menu"
        aria-label="Menu mobile"
        aria-hidden={!mobileOpen}
        className={`fixed top-0 right-0 z-[110] h-full w-80 max-w-[90vw] bg-white dark:bg-gray-950 stark-border-l dark:stark-border-l-gray-800 flex flex-col md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0 visible' : 'translate-x-full invisible pointer-events-none'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 stark-border-b dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-tighter text-black dark:text-white">FACODI</span>
            <span className="stark-border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none bg-primary text-black">
              Beta
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="w-11 h-11 flex items-center justify-center stark-border dark:border-gray-700 hover:bg-brand-muted dark:hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 mb-3">Navegar</p>
          {([
            { view: 'home' as View, label: t('nav.home'), icon: 'home' },
            { view: 'courses' as View, label: t('nav.courses'), icon: 'school' },
            { view: 'repository' as View, label: t('nav.units'), icon: 'grid_view' },
            { view: 'dashboard' as View, label: t('nav.progress'), icon: 'dashboard' },
            { view: 'blog' as View, label: t('nav.blog'), icon: 'article' },
            ...(user && (profile?.role === 'editor' || profile?.role === 'admin') ? [{ view: 'curator-submit' as View, label: 'Enviar Conteúdo', icon: 'upload' }] : []),
            ...(user && (profile?.role === 'editor' || profile?.role === 'admin') ? [{ view: 'curator-submissions' as View, label: 'Minhas Sugestões', icon: 'schedule' }] : []),
            ...(user && (profile?.role === 'editor' || profile?.role === 'admin') ? [{ view: 'curator-channel-pipeline' as View, label: 'Pipeline de Canal', icon: 'smart_display' }] : []),
            ...(user && profile?.role === 'user' ? [{ view: 'curator-apply' as View, label: 'Ser Curador', icon: 'edit_note' }] : []),
            ...(user && profile?.role === 'admin' ? [{ view: 'admin-dashboard' as View, label: 'Painel Admin', icon: 'admin_panel_settings' }] : []),
          ] as { view: View; label: string; icon: string }[]).map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => navGo(view)}
              className={`text-left w-full py-3 px-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-between border ${currentView === view ? 'facodi-primary-surface border-black shadow-[0_2px_0_rgba(0,0,0,0.2)]' : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-brand-muted dark:hover:bg-gray-800 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-gray-700'}`}
            >
              <span>{label}</span>
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </button>
          ))}
          <div className="border-t border-black/10 dark:border-gray-800 mt-6 pt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 mb-3">Projeto</p>
            {projectLinks.map(({ slug, label, icon }) => (
              <button
                key={slug}
                onClick={() => pageGo(slug)}
                className="text-left w-full py-3 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-brand-muted dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-all flex items-center justify-between"
              >
                <span>{label}</span>
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-6 py-6 stark-border-t dark:border-gray-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label htmlFor="facodi-language-mobile" className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">Idioma</label>
            <select id="facodi-language-mobile" value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)} className="bg-white dark:bg-gray-900 stark-border dark:border-gray-700 text-[10px] font-bold uppercase px-3 py-1.5 outline-none cursor-pointer text-black dark:text-white">
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          <button onClick={onToggleTheme} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-muted dark:hover:bg-gray-800 px-4 py-3 transition-all stark-border dark:border-gray-700 w-full text-black dark:text-white">
            <span className="material-symbols-outlined text-base">{isDark ? 'light_mode' : 'dark_mode'}</span>
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>
          {user ? (
            <button onClick={() => { navGo('profile'); }} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-muted dark:hover:bg-gray-800 px-4 py-3 transition-all stark-border dark:border-gray-700 w-full text-black dark:text-white">
              <span className="material-symbols-outlined text-base">account_circle</span>
              {t('nav.profile')}
            </button>
          ) : (
            <button onClick={() => { setMobileOpen(false); onOpenAuth(); }} className="facodi-primary-surface py-3 text-[10px] font-black uppercase tracking-widest stark-border w-full">
              {t('nav.login')}
            </button>
          )}
          <a
            href={CONTENT_SUBMIT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:bg-brand-muted transition-all w-full text-center"
          >
            Enviar Conteudo
          </a>
        </div>
      </nav>

      <main id="main-content" className="flex-grow pt-16 md:pt-20">
        {children}
      </main>

      <DevelopmentBadge
        label={t('development.badge')}
        onClick={openNotice}
      />

      <DevelopmentDisclaimer
        isOpen={isDevelopmentReady && isDevelopmentOpen}
        title={t('development.title')}
        body={t('development.body')}
        signedMessage={t('development.message')}
        signature={t('development.signature')}
        institutionalLine={t('development.institutional')}
        closeLabel={t('development.close')}
        onClose={() => closeNotice(true)}
      />

      <footer className="bg-white dark:bg-gray-950 border-t-2 border-black dark:border-gray-800 pt-20 pb-10 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <h3 className="text-xl font-black tracking-tighter uppercase mb-8 text-black dark:text-white">FACODI — FACULDADE COMUNITÁRIA DIGITAL</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-loose uppercase tracking-[0.1em] max-w-sm mb-8">
                Currículos oficiais com playlists abertas, progresso comunitário e orgulho Open2 Technology.
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Conteúdo disponível sob licença aberta e amor comunitário.</p>
              <div className="flex gap-4 mt-8">
                <a
                  href="https://open2.tech/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contactar Open2 Technology"
                  className="w-10 h-10 stark-border dark:border-gray-700 flex items-center justify-center facodi-hover-primary-ink transition-all text-black dark:text-white"
                >
                  <span className="material-symbols-outlined text-lg">contact_support</span>
                </a>
                <a
                  href="https://open2.tech/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir página de contato Open2 Technology"
                  className="w-10 h-10 stark-border dark:border-gray-700 flex items-center justify-center facodi-hover-primary-ink transition-all text-black dark:text-white"
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-8">NAVEGAÇÃO</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-black dark:text-gray-300">
                <li><button onClick={() => onViewChange('home')} className="hover:text-primary">Início</button></li>
                <li><button onClick={() => onViewChange('repository')} className="hover:text-primary">Cursos</button></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-8">COMUNIDADE</h5>
              <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-black dark:text-gray-300">
                <li><button onClick={() => onNavigatePage?.('manifesto')} className="hover:text-primary">Manifesto</button></li>
                <li><button onClick={() => onNavigatePage?.('sobre')} className="hover:text-primary">Sobre a FACODI</button></li>
                <li><button onClick={() => onNavigatePage?.('comunidade')} className="hover:text-primary">Comunidade</button></li>
                <li><a href={CONTENT_SUBMIT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Enviar Conteudo</a></li>
                <li><a href="https://open2.tech" className="hover:text-primary">Open2 Technology</a></li>
                <li><a href="https://open2.tech/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Contacto Open2</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div className="bg-brand-muted dark:bg-gray-900 p-8 stark-border dark:border-gray-800 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-2xl text-black dark:text-white">monitoring</span>
                   <p className="text-[10px] font-black uppercase text-black dark:text-white">Open2 Technology</p>
                </div>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider text-gray-500 dark:text-gray-400">
                   FACODI IS PART OF THE OPEN2 TECHNOLOGY OPEN ECOSYSTEM, PROMOTING ACCESSIBLE TECH FOR THE GLOBAL SOUTH.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-black/10 dark:border-gray-800">
            {/* Institutional reference section */}
            <div className="mb-8 pb-8 border-b border-black/10 dark:border-gray-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('institutional.footer.text')}
              </p>
            </div>

            {/* Copyright and disclaimer */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 dark:text-gray-600">© 2026 OPEN2 TECHNOLOGY. CONSTRUÍDO COM CARINHO PELA COMUNIDADE FACODI.</p>
              <div className="flex gap-8 text-[9px] font-bold uppercase tracking-[0.4em] text-black dark:text-gray-300">
                <a href={CONTENT_SUBMIT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">ENVIAR CONTEUDO</a>
                <a href="https://open2.tech/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary">CONTACTO</a>
                <button onClick={() => onNavigateLegal?.('privacy-policy')} className="hover:text-primary">PRIVACIDADE</button>
                <button onClick={() => onNavigateLegal?.('terms-of-service')} className="hover:text-primary">TERMOS</button>
                <button onClick={() => onNavigateLegal?.('cookie-policy')} className="hover:text-primary">COOKIES</button>
                <button onClick={onOpenCookiePreferences} className="hover:text-primary">PREFERENCIAS DE COOKIES</button>
                {user && <button onClick={() => onViewChange('profile')} className="hover:text-primary">ELIMINAR CONTA</button>}
                <details className="cursor-pointer">
                  <summary className="hover:text-primary">AVISO LEGAL</summary>
                  <div className="mt-4 text-[8px] font-medium leading-relaxed p-4 bg-gray-50 dark:bg-gray-900 stark-border dark:border-gray-800 max-w-2xl text-black dark:text-gray-300">
                    <p>{t('institutional.disclaimer.pt')}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
