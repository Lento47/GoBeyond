import { useEffect, useMemo, useState } from "react";
import BlueprintDiscovery from "./components/BlueprintDiscovery";
import { SecurityTurnstile } from "./components/SecurityTurnstile";
import { normalizePublicMediaUrl } from "./embedUtils";
import { MarkdownContent } from "../../shared/MarkdownContent";
import { PublicImageWithFallback } from "../../shared/PublicImageWithFallback";

const legalFooterLinks = [
  { href: "/terminos", label: "Terminos y Condiciones" },
  { href: "/privacidad", label: "Politica de Privacidad" },
  { href: "/cookies", label: "Politica de Cookies" },
  { href: "/aviso-legal", label: "Aviso Legal" },
];

function slugifySectionLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- LIGHT THEME IMMERSIVE COMPONENTS ---

const Aurora = () => (
  <div className="aurora-container" aria-hidden="true">
    <div className="aurora-bg" />
  </div>
);

const Reveal = ({ children, className = "", delay = 0 }) => (
  <div 
    className={`canvas-reveal ${className}`} 
    style={{ transitionDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const BentoCard = ({ children, className = "", span = "col-span-1" }) => (
  <div className={`glass-immersive p-8 rounded-[2rem] ${span} ${className}`}>
    {children}
  </div>
);

function TestimonialSubmissionForm({ createTestimonialSubmission, turnstileSiteKey }) {
    const [form, setForm] = useState({ quote: "", author: "", organization: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const requiresTurnstile = Boolean(turnstileSiteKey);
  
    async function handleSubmit(event) {
      event.preventDefault();
      if (requiresTurnstile && !turnstileToken) {
        setError("Completa la verificacion de seguridad.");
        return;
      }
  
      setSubmitting(true);
      setMessage("");
      setError("");
  
      try {
        const response = await createTestimonialSubmission({
          ...form,
          turnstileToken,
        });
        setMessage(response.message);
        setForm({ quote: "", author: "", organization: "" });
        setTurnstileResetKey((current) => current + 1);
        setTurnstileToken("");
      } catch (requestError) {
        setError(requestError.message);
        setTurnstileResetKey((current) => current + 1);
        setTurnstileToken("");
      } finally {
        setSubmitting(false);
      }
    }
  
    return (
      <form
        className="glass-immersive p-8 rounded-[2rem] grid gap-6"
        onSubmit={handleSubmit}
      >
        <p className="text-caption">Tu Impacto</p>
        <div>
          <label htmlFor="testimonial-quote" className="sr-only">Tu testimonio</label>
          <textarea
            id="testimonial-quote"
            className="min-h-[120px] w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900"
            disabled={submitting}
            onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
            placeholder="¿Cómo te ha transformado GoBeyond?"
            value={form.quote}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="testimonial-author" className="sr-only">Nombre</label>
            <input
              id="testimonial-author"
              className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900 disabled:opacity-50"
              disabled={submitting}
              onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              placeholder="Nombre"
              value={form.author}
            />
          </div>
          <div>
            <label htmlFor="testimonial-org" className="sr-only">Organización</label>
            <input
              id="testimonial-org"
              className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900 disabled:opacity-50"
              disabled={submitting}
              onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
              placeholder="Organización"
              value={form.organization}
            />
          </div>
        </div>
        <SecurityTurnstile
          action="public-testimonial"
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
          siteKey={turnstileSiteKey}
        />
        <button
          className="bg-blue-600 text-white font-black h-12 px-8 rounded-full hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20"
          disabled={submitting || (requiresTurnstile && !turnstileToken)}
          type="submit"
        >
          {submitting ? "Publicando..." : "Publicar Impacto"}
        </button>
        {message ? <p className="text-sm text-blue-600 font-bold">{message}</p> : null}
        {error ? <p className="text-sm text-red-600 font-bold">{error}</p> : null}
      </form>
    );
}

export function PublicExperience({ content, createTestimonialSubmission, onRequestLogin, noticiasPosts = [], noticiasLoading = false, noticiasError = "" }) {
  const landing = content?.landing ?? {};
  const hero = content?.hero ?? {};
  const brand = content?.brand ?? {};
  const benefits = useMemo(() => Array.isArray(content?.benefits) ? content.benefits : [], [content?.benefits]);
  const learningPath = useMemo(() => Array.isArray(content?.learningPath) ? content.learningPath : [], [content?.learningPath]);
  const visibleInstitutions = useMemo(() => Array.isArray(content?.institutions) ? content.institutions : [], [content?.institutions]);
  const testimonials = useMemo(() => (Array.isArray(content?.testimonials) ? content.testimonials : []).filter((item) => !item.status || item.status === "approved"), [content?.testimonials]);
  const programCards = useMemo(() => (Array.isArray(landing?.programCards) && landing.programCards.length ? landing.programCards : []), [landing?.programCards]);

  // Split programCards: individual programs (no type:section) vs packages (after section divider)
  const { individualPrograms, packageSection, packageCards } = useMemo(() => {
    const cards = programCards;
    const sectionIdx = cards.findIndex((c) => c.type === "section");
    if (sectionIdx === -1) {
      return { individualPrograms: cards, packageSection: null, packageCards: [] };
    }
    return {
      individualPrograms: cards.slice(0, sectionIdx),
      packageSection: cards[sectionIdx],
      packageCards: cards.slice(sectionIdx + 1).filter(c => c.type !== "section"),
    };
  }, [programCards]);

  const metrics = useMemo(() => Array.isArray(hero.metrics) ? hero.metrics : [], [hero.metrics]);
  
  const navLabels = useMemo(() => (Array.isArray(landing.nav) && landing.nav.length) ? landing.nav : ["Inicio", "Sobre nosotros", "Servicios", "Cursos", "Testimonios", "Contacto"], [landing.nav]);
  const navItems = useMemo(() => {
    const labelToId = {
      "inicio": "inicio",
      "sobre nosotros": "proyecto",
      "servicios": "rutas",
      "cursos": "programas",
      "programas": "programas",
      "instituciones": "instituciones",
      "testimonios": "voces",
      "noticias": "noticias",
      "contacto": "contacto",
      "proyecto": "sobre-nosotros",
      "rutas": "servicios",
      "impacto": "impacto",
      "voces": "voces",
    };
    return navLabels.map((label) => {
      const key = label.toLowerCase().trim();
      const id = labelToId[key] || slugifySectionLabel(label);
      return { label, id };
    });
  }, [navLabels]);
  
  const [activeSection, setActiveSection] = useState("inicio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Scroll-reveal observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.canvas-reveal').forEach(el => revealObserver.observe(el));

    // Scroll-spy observer for nav active state
    const sectionIds = navItems.map(item => item.id);
    const spyObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActiveSection(visible[0].target.id);
      }
    }, { threshold: [0.1, 0.3], rootMargin: '-10% 0px -40% 0px' });

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) spyObserver.observe(el);
    }

    return () => {
      revealObserver.disconnect();
      spyObserver.disconnect();
    };
  }, [navItems]);

  const blueprintNodes = useMemo(() => {
    const w = viewportWidth;
    return [
      // Hero Section
      { label: "GO", x: 200, y: 300 },
      { label: "BEYOND", x: 500, y: 450 },
      { label: "TRANSFORMA", x: w - 300, y: 200 },
      { label: "DIGITAL", x: 150, y: 700 },

      // Proyecto Section
      { label: "VISIÓN", x: w - 200, y: 1200 },
      { label: "PROPÓSITO", x: 300, y: 1500 },
      { label: "ALTO IMPACTO", x: w - 400, y: 1700 },

      // Rutas Section
      { label: "CRECIMIENTO", x: 200, y: 2200 },
      { label: "LIDERAZGO", x: w - 300, y: 2500 },
      { label: "SISTEMA", x: 400, y: 2800 },

      // Programas Section
      { label: "EXCELENCIA", x: w - 450, y: 3300 },
      { label: "CALIDAD", x: 150, y: 3600 },
      { label: "TÉCNICA", x: w - 250, y: 3900 },
      { label: "SOPORTE", x: 400, y: 4100 },

      // Impacto Section
      { label: "MODALIDAD", x: 200, y: 4500 },
      { label: "SOCIAL", x: w - 350, y: 4800 },
      { label: "TALENTO", x: 300, y: 5100 },
      { label: "BE BEYOND", x: w - 400, y: 5300 },

      // Footer Area
      { label: "FUTURO", x: 250, y: 5600 },
      { label: "CAMBIO", x: w - 300, y: 5800 },
      { label: "ÚNETE", x: 500, y: 6000 },
    ];
  }, [viewportWidth]);

  return (
    <div className="relative min-h-screen bg-[#fdfdfd] text-[#0f172a] selection:bg-blue-600/10 font-sans paper-texture">
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-5 focus:py-3 focus:bg-white focus:text-slate-900 focus:rounded-xl focus:shadow-2xl focus:font-bold focus:text-sm">
        Saltar al contenido principal
      </a>
      <BlueprintDiscovery nodes={blueprintNodes} />
      <Aurora />

      {/* FLOATING NAVBAR (LIGHT) */}
      <header className="fixed top-6 inset-x-0 z-[100] px-4 sm:px-6">
        <nav className="max-w-7xl mx-auto glass-immersive rounded-full h-16 px-4 sm:px-8 flex items-center justify-between border-slate-100 shadow-xl shadow-slate-200/50">
          <a className="flex items-center gap-2 shrink-0" href="#inicio">
            <img alt="GoBeyond" className="h-8 w-8" src="/logo-icon.png" />
            <span className="hidden lg:block font-black text-xs uppercase tracking-[0.22em] text-slate-900">{brand.name || "GoBeyond"}</span>
          </a>
          <div className="hidden md:flex items-center gap-1 lg:gap-4 overflow-x-auto scrollbar-none mx-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`shrink-0 px-2 lg:px-3 py-2 text-[10px] lg:text-[11px] uppercase tracking-[0.1em] font-bold transition-colors rounded-full hover:bg-slate-50 ${activeSection === item.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <button onClick={onRequestLogin} className="min-h-[44px] px-4 lg:px-6 rounded-full bg-slate-950 text-white text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 whitespace-nowrap">
               Ingresar
             </button>
             <button
                aria-controls="mobile-nav"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
                className="md:hidden min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1.5 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className={`block w-5 h-0.5 bg-slate-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block w-5 h-0.5 bg-slate-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-slate-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </button>
          </div>
        </nav>
      </header>

      {/* Mobile nav panel */}
      {mobileMenuOpen ? (
        <div id="mobile-nav" className="fixed inset-0 top-24 z-[90] bg-white/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col items-center gap-6 py-16 px-6">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg font-bold uppercase tracking-[0.08em] transition-colors ${
                  activeSection === item.id ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <main id="main-content" className="relative z-10">
        
        {/* HERO SECTION: PRISTINE MINIMALIST */}
        <section id="inicio" className="relative min-h-screen flex items-center justify-center px-6 pt-36 pb-36 overflow-hidden bg-transparent">
          <div className="max-w-5xl mx-auto w-full relative z-10 text-center">
            <Reveal delay={100}>
              <p className="text-caption mb-12">{hero.eyebrow || "Digital Academy"}</p>
              <h1 className="heading-editorial text-[2.5rem] sm:text-[4rem] lg:text-[5.5rem] mb-12 text-slate-900">
                  {hero.title || brand.tagline}
              </h1>
              <div className="max-w-2xl mx-auto mb-16">
                <MarkdownContent className="text-xl text-slate-500 font-light leading-relaxed">
                  {hero.description || brand.description}
                </MarkdownContent>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                  <a href="#rutas" className="btn-primary h-16 px-12 rounded-full bg-slate-900 text-white text-sm font-bold tracking-[0.08em] hover:bg-blue-600 shadow-2xl">
                      Explorar Ahora
                  </a>
                  <a href="#contacto" className="btn-primary h-16 px-12 rounded-full border border-slate-200 text-slate-900 text-sm font-bold tracking-[0.08em] shadow-xl hover:bg-slate-50">
                      Contáctanos
                  </a>
              </div>
            </Reveal>
          </div>

          {/* METRICS MARQUEE (LIGHT) */}
          {metrics.length > 0 ? (
          <div className="absolute bottom-12 left-0 w-full overflow-hidden border-y border-slate-100 bg-white/50 backdrop-blur-sm py-4">
               <div className="marquee-container opacity-90">
                   <div className="marquee-content">
                       {metrics.map((m, i) => (
                           <div key={i} className="flex items-center gap-4 whitespace-nowrap">
                               <span className="text-4xl font-black text-slate-900">{m.value}</span>
                               <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-blue-600">{m.label}</span>
                               <span className="mx-8 text-slate-300">/</span>
                           </div>
                       ))}
                   </div>
                   <div className="marquee-content" aria-hidden="true">
                       {metrics.map((m, i) => (
                           <div key={i} className="flex items-center gap-4 whitespace-nowrap">
                               <span className="text-4xl font-black text-slate-900">{m.value}</span>
                               <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-blue-600">{m.label}</span>
                               <span className="mx-8 text-slate-300">/</span>
                           </div>
                       ))}
                   </div>
               </div>
          </div>
          ) : null}
        </section>

        {/* PROYECTO & BENEFICIOS */}
        <section id="proyecto" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <Reveal>
                    <p className="text-caption mb-4">El Proyecto</p>
                    <h2 className="heading-editorial text-[3rem] lg:text-[5rem] mb-20 text-slate-900">Visión Real</h2>
                </Reveal>
                
                <div className="grid lg:grid-cols-12 gap-6">
                    <BentoCard span="lg:col-span-8" className="bg-white/80">
                        <MarkdownContent className="text-2xl lg:text-3xl font-light leading-snug text-slate-700">
                            {landing.aboutBody || brand.description}
                        </MarkdownContent>
                        {landing.aboutBodyTwo && (
                            <MarkdownContent className="mt-8 text-lg text-slate-400 font-light italic">
                                {landing.aboutBodyTwo}
                            </MarkdownContent>
                        )}
                    </BentoCard>
                    
                    <div className="lg:col-span-4 grid gap-6">
                        {benefits.slice(0, 3).map((b, i) => (
                            <BentoCard key={i} className="flex flex-col justify-center bg-white border-slate-100 group cursor-default">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-5">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <p className="text-base font-semibold text-slate-800 leading-snug">{b}</p>
                                <div className="mt-5 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-500 rounded-full" />
                            </BentoCard>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* RUTAS DE APRENDIZAJE */}
        <section id="rutas" className="py-32 px-6 bg-slate-50/50 border-y border-slate-100">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
                    <Reveal>
                        <p className="text-caption mb-4">Excelencia</p>
                        <h2 className="heading-editorial text-[3rem] lg:text-[5rem] text-slate-900">Rutas</h2>
                    </Reveal>
                    <Reveal delay={200} className="max-w-md">
                        <MarkdownContent className="text-lg text-slate-400 font-light">
                            {landing.relevanceBody || content?.subscription?.description}
                        </MarkdownContent>
                    </Reveal>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {learningPath.map((item, i) => (
                        <BentoCard key={i} className="group bg-white border-slate-100 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-mono text-4xl font-black text-slate-300 group-hover:text-blue-200 transition-colors">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed flex-1">{item.status}</p>
                            <span className="mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500">{item.type}</span>
                        </BentoCard>
                    ))}
                </div>
            </div>
        </section>

        {/* PROGRAMAS: RICH CARDS WITH RELEVANCE + OUTCOMES */}
        <section id="programas" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <p className="text-caption mb-6">{landing.coursesTitle || "Contenidos"}</p>
                    <h2 className="heading-editorial text-[3rem] lg:text-[5rem] text-slate-900">{landing.coursesHeading || "Programas"}</h2>
                    {landing.relevanceBody ? (
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-500 font-light leading-relaxed">
                            {landing.relevanceBody}
                        </p>
                    ) : null}
                </div>

                <div className="grid gap-32">
                    {individualPrograms.map((program, i) => (
                        <Reveal key={program.id} delay={i * 100} className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className={`overflow-hidden rounded-[3rem] aspect-[16/10] glass-immersive border-slate-100 shadow-2xl ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                                {program.image ? (
                                    <PublicImageWithFallback
                                        alt={program.title}
                                        className="w-full h-full object-cover transition-all duration-1000 scale-105 hover:scale-100"
                                        src={normalizePublicMediaUrl(program.image)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <span className="text-6xl font-black text-slate-300">
                                            {String(program.title || "GB").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                {program.eyebrow ? (
                                    <span className="px-4 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-semibold uppercase tracking-[0.08em]">
                                        {program.eyebrow}
                                    </span>
                                ) : null}
                                <h3 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900">{program.title}</h3>
                                <MarkdownContent className="text-lg text-slate-500 font-light leading-relaxed">
                                    {program.description}
                                </MarkdownContent>

                                {/* Why relevant? */}
                                {program.relevance ? (
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-2">
                                            ¿Por qué es relevante?
                                        </p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{program.relevance}</p>
                                    </div>
                                ) : null}

                                {/* Outcomes as bullet list */}
                                {Array.isArray(program.outcomes) && program.outcomes.length > 0 ? (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">
                                            {landing.courseResultsLabel || "Resultados"}
                                        </p>
                                        <ul className="grid gap-2">
                                            {program.outcomes.map((item, j) => (
                                                <li key={j} className="flex gap-3 text-sm text-slate-600 leading-snug">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {/* Certification note + CTA */}
                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-blue-600">
                                        {program.certificationNote || "Certificación Oficial"}
                                    </p>
                                    {program.ctaLabel ? (
                                        <a
                                            href={program.href || "#contacto"}
                                            className="text-[12px] font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-slate-900 transition-colors flex items-center gap-3"
                                        >
                                            {program.ctaLabel}
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>

        {/* PAQUETES: INSTITUTION PACKAGES */}
        <section id="impacto" className="py-32 px-6">
             <div className="max-w-7xl mx-auto">
                 {packageSection ? (
                     <Reveal className="mb-16 text-center">
                         <p className="text-caption mb-4">{packageSection.title || "Paquetes"}</p>
                         <h2 className="heading-editorial text-slate-900 text-[3rem] lg:text-[5rem]">
                             {packageSection.heading || "Programas disenados para instituciones educativas."}
                         </h2>
                         {packageSection.subheading ? (
                             <MarkdownContent className="mt-4 max-w-2xl mx-auto text-base text-slate-500 leading-relaxed font-light">
                                 {packageSection.subheading}
                             </MarkdownContent>
                         ) : null}
                     </Reveal>
                 ) : null}

                 {packageCards.length > 0 ? (
                     <div className="grid gap-6 lg:grid-cols-3">
                         {packageCards.map((pkg, i) => {
                             const initials = String(pkg.title || "GB").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                             const isHighlighted = i === 1;
                             return (
                                 <Reveal key={pkg.id || i} delay={i * 120}>
                                     <BentoCard className={`flex flex-col h-full bg-white group ${
                                         isHighlighted
                                             ? 'border-blue-500/20 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/10'
                                             : 'border-slate-100'
                                     }`}>
                                         {/* Dark header with initials */}
                                         <div className="-mx-8 -mt-8 mb-6 overflow-hidden rounded-t-[2rem] bg-slate-900 px-8 pt-8 pb-6">
                                             <div className="absolute right-6 top-6 text-4xl font-black text-white/10 select-none">
                                                 {initials}
                                             </div>
                                             <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-blue-400 relative">
                                                 {brand.name || "Go Beyond"}
                                             </p>
                                         </div>

                                         {pkg.eyebrow ? (
                                             <span className="inline-block rounded-full border border-blue-600/20 bg-blue-600/8 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">
                                                 {pkg.eyebrow}
                                             </span>
                                         ) : null}

                                         <h3 className="text-xl font-black tracking-tight text-slate-900 mb-3">{pkg.title}</h3>

                                         {pkg.description ? (
                                             <MarkdownContent className="text-sm leading-relaxed text-slate-500 mb-4">
                                                 {pkg.description}
                                             </MarkdownContent>
                                         ) : null}

                                         {/* Available programs */}
                                         {Array.isArray(pkg.availablePrograms) && pkg.availablePrograms.length > 0 ? (
                                             <div className="mb-4">
                                                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">
                                                     Programas disponibles
                                                 </p>
                                                 <ul className="grid gap-1.5">
                                                     {pkg.availablePrograms.map((item, j) => (
                                                         <li key={j} className="flex gap-2.5 text-sm text-slate-500 leading-relaxed">
                                                             <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/60" />
                                                             <span className="min-w-0 break-words">{item}</span>
                                                         </li>
                                                     ))}
                                                 </ul>
                                             </div>
                                         ) : null}

                                         {/* Includes */}
                                         {Array.isArray(pkg.includes) && pkg.includes.length > 0 ? (
                                             <div className="mb-4">
                                                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">
                                                     Incluye
                                                 </p>
                                                 <ul className="grid gap-1.5">
                                                     {pkg.includes.map((item, j) => (
                                                         <li key={j} className="flex gap-2.5 text-sm text-slate-500 leading-relaxed">
                                                             <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/60" />
                                                             <span className="min-w-0 break-words">{item}</span>
                                                         </li>
                                                     ))}
                                                 </ul>
                                             </div>
                                         ) : null}

                                         {/* Benefits */}
                                         {Array.isArray(pkg.benefits) && pkg.benefits.length > 0 ? (
                                             <div className="mb-4">
                                                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2">
                                                     Beneficios adicionales
                                                 </p>
                                                 <ul className="grid gap-1.5">
                                                     {pkg.benefits.map((item, j) => (
                                                         <li key={j} className="flex gap-2.5 text-sm text-slate-500 leading-relaxed">
                                                             <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/60" />
                                                             <span className="min-w-0 break-words">{item}</span>
                                                         </li>
                                                     ))}
                                                 </ul>
                                             </div>
                                         ) : null}

                                         {/* CTA */}
                                         {pkg.ctaLabel ? (
                                             <a
                                                 className="mt-auto pt-5 border-t border-slate-100 inline-flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.15em] text-blue-500 hover:text-slate-900 transition-colors"
                                                 href={pkg.href || "#contacto"}
                                                 rel={pkg.href?.startsWith("http") ? "noreferrer" : undefined}
                                                 target={pkg.href?.startsWith("http") ? "_blank" : undefined}
                                             >
                                                 <span>{pkg.ctaLabel}</span>
                                                 <span>&rarr;</span>
                                             </a>
                                         ) : null}
                                     </BentoCard>
                                 </Reveal>
                             );
                         })}
                     </div>
                 ) : null}
             </div>
        </section>

        {/* INSTITUCIONES */}
        {visibleInstitutions.length > 0 ? (
        <section id="instituciones" className="py-32 px-6 bg-white border-y border-slate-100">
             <div className="max-w-7xl mx-auto">
                 <Reveal className="text-center mb-16">
                     <p className="text-caption mb-4">Instituciones</p>
                     <h2 className="heading-editorial text-[3rem] lg:text-[5rem] text-slate-900">Instituciones</h2>
                     <p className="mt-4 max-w-xl mx-auto text-lg text-slate-500 font-light leading-relaxed">
                         Organizaciones que confian en GoBeyond para la formacion de alto impacto.
                     </p>
                 </Reveal>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                     {visibleInstitutions.map((inst) => (
                         <Reveal key={inst.id} className="flex flex-col items-center gap-4">
                             <div className="w-full aspect-[3/2] rounded-2xl border border-slate-100 bg-white p-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                                 {inst.image ? (
                                     <PublicImageWithFallback
                                         alt={inst.name}
                                         className="max-h-full max-w-full object-contain"
                                         src={normalizePublicMediaUrl(inst.image)}
                                     />
                                 ) : (
                                     <span className="text-3xl font-black text-slate-200">
                                         {String(inst.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                     </span>
                                 )}
                             </div>
                             <p className="text-xs font-semibold text-slate-500 text-center">{inst.name}</p>
                         </Reveal>
                     ))}
                 </div>
             </div>
        </section>
        ) : null}

        {/* TESTIMONIOS: LIGHT VOICES */}
        <section id="voces" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    <Reveal>
                        <p className="text-caption mb-4">Testimonios</p>
                        <h2 className="heading-editorial text-[3rem] lg:text-[5rem] mb-12 text-slate-900">Testimonios</h2>
                        <MarkdownContent className="text-lg text-slate-500 font-light max-w-md">
                            Historias de transformación que impulsan nuestro propósito. La educación es el motor del cambio.
                        </MarkdownContent>
                        
                    </Reveal>

                    <div className="space-y-6">
                        {testimonials.slice(0, 3).map((t, i) => (
                            <BentoCard key={i} className={`bg-white border-slate-100 ${i === 0 ? 'shadow-lg' : 'shadow-none'}`}>
                                <span aria-hidden="true" className="text-6xl text-slate-300 leading-none select-none block mb-2 font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>"</span>
                                <p className="text-base font-light leading-relaxed text-slate-600 mb-6 -mt-4">{t.quote}</p>
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                     <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] font-mono">
                                         {String(t.author || "A")[0].toUpperCase()}
                                     </div>
                                     <div className="min-w-0">
                                         <p className="text-[11px] font-bold text-slate-900 truncate">{t.author}</p>
                                         <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider truncate">{t.organization}</p>
                                     </div>
                                </div>
                            </BentoCard>
                        ))}
                        <TestimonialSubmissionForm
                            createTestimonialSubmission={createTestimonialSubmission}
                            turnstileSiteKey={content?.securityPublic?.siteKey}
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* CONTACTO */}
        <section id="contacto" className="py-32 px-6 bg-slate-900 text-white">
             <div className="max-w-7xl mx-auto grid gap-16 lg:grid-cols-[1fr_0.9fr] items-start">
                 <Reveal>
                     <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">
                         {landing.contactTitle || "Contacto"}
                     </p>
                     <h2 className="heading-editorial text-[3rem] lg:text-[5rem] text-white mb-6">
                         Ponte en contacto y ayudanos a ampliar oportunidades.
                     </h2>
                     <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg mb-10">
                         {landing.contactBody || "Escribenos para conocer mas sobre nuestros programas, paquetes institucionales o alianzas estrategicas."}
                     </p>
                     <div className="grid gap-4">
                         {landing.contactInfo?.emailValue ? (
                             <a href={`mailto:${landing.contactInfo.emailValue}`} className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-4 text-white hover:border-slate-600 transition-colors">
                                 <span className="text-blue-400 text-xl">@</span>
                                 <div>
                                     <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{landing.contactInfo.emailLabel || "Email"}</p>
                                     <p className="text-sm font-semibold">{landing.contactInfo.emailValue}</p>
                                 </div>
                             </a>
                         ) : null}
                         {landing.contactInfo?.phoneValue ? (
                             <a href={`tel:${landing.contactInfo.phoneValue.replace(/[^\d+]/g, "")}`} className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-4 text-white hover:border-slate-600 transition-colors">
                                 <span className="text-blue-400 text-xl">&#9990;</span>
                                 <div>
                                     <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{landing.contactInfo.phoneLabel || "Telefono"}</p>
                                     <p className="text-sm font-semibold">{landing.contactInfo.phoneValue}</p>
                                 </div>
                             </a>
                         ) : null}
                     </div>
                     <div className="flex flex-wrap gap-3 mt-6">
                         {(landing.contactActions || []).map((item) => (
                             <a key={item} href="#contacto" className="text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-full border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white transition-colors">
                                 {item}
                             </a>
                         ))}
                     </div>
                 </Reveal>

                 {landing.contactFormUrl ? (
                     <Reveal delay={200}>
                         <div className="rounded-[2rem] border border-slate-700 bg-slate-800/30 p-8 text-center">
                             <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Formulario</p>
                             <p className="text-lg font-semibold text-white mb-6">Completa el formulario y te respondemos pronto.</p>
                             <a
                                 href={landing.contactFormUrl}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="btn-primary h-14 px-10 rounded-full bg-blue-600 text-white text-sm font-bold tracking-[0.08em] hover:bg-blue-500 shadow-xl inline-flex items-center gap-3"
                             >
                                 {landing.contactFormLabel || "Abrir formulario"} <span>&rarr;</span>
                             </a>
                         </div>
                     </Reveal>
                 ) : null}
             </div>
        </section>

        {/* NOTICIAS */}
        <section id="noticias" className="py-32 px-6 bg-slate-50/50 border-y border-slate-100">
             <div className="max-w-7xl mx-auto">
                 <Reveal className="mb-16">
                     <p className="text-caption mb-4">Noticias</p>
                     <h2 className="heading-editorial text-[3rem] lg:text-[5rem] text-slate-900">Noticias</h2>
                 </Reveal>

                 {noticiasLoading ? (
                     <p className="text-center text-slate-400 text-sm">Cargando noticias...</p>
                 ) : noticiasError ? (
                     <p className="text-center text-slate-400 text-sm">No se pudieron cargar las noticias.</p>
                 ) : noticiasPosts.length > 0 ? (
                     <div className="grid gap-8">
                         {noticiasPosts.slice(0, 1).map((featured) => (
                             <Reveal key={featured.id}>
                                 <article className="grid lg:grid-cols-2 gap-8 items-center rounded-[2rem] overflow-hidden border border-slate-100 bg-white shadow-lg hover:shadow-xl transition-shadow">
                                     <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                                         {featured.image ? (
                                             <PublicImageWithFallback
                                                 alt={featured.title}
                                                 className="w-full h-full object-cover"
                                                 src={normalizePublicMediaUrl(featured.image)}
                                             />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                 <span className="text-6xl font-black text-slate-200">N</span>
                                             </div>
                                         )}
                                     </div>
                                     <div className="p-8 lg:py-8 lg:pr-8 lg:pl-0">
                                         <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-3">
                                             {featured.source || "Noticia"}
                                             {featured.publishedAt ? ` · ${new Date(featured.publishedAt).toLocaleDateString("es-CR")}` : ""}
                                         </p>
                                         <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-4">{featured.title}</h3>
                                         <p className="text-sm text-slate-500 leading-relaxed mb-6">{featured.excerpt || featured.summary}</p>
                                         {featured.link ? (
                                             <a href={featured.link} target="_blank" rel="noreferrer" className="text-[12px] font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-slate-900 transition-colors">
                                                 Ver referencia &rarr;
                                             </a>
                                         ) : null}
                                     </div>
                                 </article>
                             </Reveal>
                         ))}
                         {noticiasPosts.length > 1 ? (
                             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {noticiasPosts.slice(1, 4).map((item) => (
                                     <BentoCard key={item.id} className="bg-white border-slate-100 flex flex-col">
                                         {item.image ? (
                                             <div className="-mx-8 -mt-8 mb-5 overflow-hidden rounded-t-[2rem] aspect-[16/9] bg-slate-100">
                                                 <PublicImageWithFallback
                                                     alt={item.title}
                                                     className="w-full h-full object-cover"
                                                     src={normalizePublicMediaUrl(item.image)}
                                                 />
                                             </div>
                                         ) : null}
                                         <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-2">
                                             {item.source || "Noticia"}
                                         </p>
                                         <h3 className="text-lg font-black tracking-tight text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
                                         <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{item.excerpt || item.summary}</p>
                                         {item.link ? (
                                             <a href={item.link} target="_blank" rel="noreferrer" className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-slate-900 transition-colors">
                                                 Ver &rarr;
                                             </a>
                                         ) : null}
                                     </BentoCard>
                                 ))}
                             </div>
                         ) : null}
                         <div className="text-center mt-8">
                             <a href="/noticias" className="btn-primary h-12 px-8 rounded-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-[0.08em] hover:bg-slate-50 shadow-sm inline-flex items-center gap-3">
                                 Ver todas las noticias <span>&rarr;</span>
                             </a>
                         </div>
                     </div>
                 ) : (
                     <div className="text-center py-16">
                         <p className="text-slate-400 text-sm mb-6">Las noticias y publicaciones apareceran aqui cuando el administrador las publique.</p>
                         <a href="/noticias" className="btn-primary h-12 px-8 rounded-full bg-slate-900 text-white text-sm font-bold tracking-[0.08em] hover:bg-blue-600 shadow-xl inline-flex items-center gap-3">
                             Ir al archivo de noticias <span>&rarr;</span>
                         </a>
                     </div>
                 )}
             </div>
        </section>

        {/* FOOTER */}
        <footer className="relative py-24 px-6 border-t border-slate-100 bg-white">
             <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                 <img alt="GoBeyond" className="h-12 w-12 mb-8 grayscale opacity-40" src="/logo-icon.png" />
                 <h2 className="heading-editorial text-[4rem] lg:text-[6rem] mb-10 text-slate-200 select-none">BEYOND</h2>
                 <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-12">
                     {legalFooterLinks.map((link, i) => (
                         <a key={i} href={link.href} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 hover:text-blue-600 transition-colors">
                             {link.label}
                         </a>
                     ))}
                 </div>
                 <p className="text-[11px] font-medium text-slate-400">
                     &copy; {new Date().getFullYear()} {brand.name || "GoBeyond"}. Puerto Limon, Costa Rica.
                 </p>
             </div>
        </footer>

      </main>
    </div>
  );
}
