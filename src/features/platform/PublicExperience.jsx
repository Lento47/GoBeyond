import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { EmbedFeedbackCarousel } from "./components/EmbedFeedbackCarousel";
import { getPublishedNews } from "./newsUtils";

const Visual3D = lazy(() => import("./components/Visual3D"));

function slugifySectionLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEmbedUrl(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";

  const iframeMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1].trim();
  if (/^https?:\/\//i.test(input)) return input;
  return "";
}

function getActionHref(label, news, institutions, socialLinks) {
  const normalized = normalizeText(label);
  const externalReference = [...(news ?? []), ...(institutions ?? [])].find((item) => item?.link)?.link;

  if (normalized.includes("noticia")) return "/noticias";
  if (normalized.includes("contact")) return "#contacto";
  if (normalized.includes("facebook")) {
    return socialLinks?.facebook || externalReference || "#testimonios";
  }
  if (normalized.includes("linkedin")) {
    return socialLinks?.linkedin || externalReference || "#testimonios";
  }

  return "#inicio";
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

function truncateText(value, maxLength) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

// --- COMPONENTES ATÓMICOS ---
const SectionTag = ({ children }) => (
  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block">
    {children}
  </span>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-blue-500/30 hover:bg-white/[0.04] ${className}`}>
    {children}
  </div>
);

const Badge = ({ children }) => (
  <span className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-full">
    {children}
  </span>
);

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-gray-500">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function EmbedFrame({ src, title, className = "" }) {
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className={`h-full w-full border-0 ${className}`}
      height="100%"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      src={src}
      title={title}
      width="100%"
    />
  );
}

function TestimonialSubmissionForm({ createTestimonialSubmission }) {
  const [form, setForm] = useState({ quote: "", author: "", organization: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await createTestimonialSubmission(form);
      setMessage(response.message);
      setForm({ quote: "", author: "", organization: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-5 rounded-[2rem] border border-white/12 bg-[#0b0b0b]/35 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-8"
      onSubmit={handleSubmit}
    >
      <p className="text-[11px] uppercase tracking-[0.3em] text-blue-100">Comparte tu experiencia</p>
      <textarea
        className="min-h-[160px] rounded-[1.5rem] border border-white/12 bg-white/10 px-5 py-4 text-sm text-white outline-none transition placeholder:text-blue-100/50 focus:border-white/40 focus:bg-white/15"
        onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
        placeholder="Escribe tu testimonio"
        value={form.quote}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="rounded-[999px] border border-white/12 bg-white/10 px-5 py-4 text-sm text-white outline-none transition placeholder:text-blue-100/50 focus:border-white/40 focus:bg-white/15"
          onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
          placeholder="Tu nombre"
          value={form.author}
        />
        <input
          className="rounded-[999px] border border-white/12 bg-white/10 px-5 py-4 text-sm text-white outline-none transition placeholder:text-blue-100/50 focus:border-white/40 focus:bg-white/15"
          onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
          placeholder="Institucion u organizacion"
          value={form.organization}
        />
      </div>
      <button
        className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-blue-600 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-60 sm:w-fit"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Enviando..." : "Enviar testimonio"}
      </button>
      {message ? <p className="text-sm text-blue-100">{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </form>
  );
}

// --- MAIN PAGE ---
export function PublicExperience({ content, createTestimonialSubmission, onNavigateToNewsArchive, onRequestLogin }) {
  const landing = content?.landing ?? {};
  const socialLinks = useMemo(
    () => ({
      facebook: landing?.socialLinks?.facebook ?? "",
      linkedin: landing?.socialLinks?.linkedin ?? "",
    }),
    [landing?.socialLinks?.facebook, landing?.socialLinks?.linkedin]
  );
  const hero = content?.hero ?? {};
  const brand = content?.brand ?? {};
  const benefits = useMemo(() => content?.benefits ?? [], [content?.benefits]);
  const learningPath = useMemo(() => content?.learningPath ?? [], [content?.learningPath]);
  const courses = useMemo(() => content?.courses ?? [], [content?.courses]);
  const liveSessions = useMemo(() => content?.liveSessions ?? [], [content?.liveSessions]);
  const accessTimeline = useMemo(() => content?.accessTimeline ?? [], [content?.accessTimeline]);
  const communityStats = useMemo(() => content?.communityStats ?? [], [content?.communityStats]);
  const institutions = useMemo(() => content?.institutions ?? [], [content?.institutions]);
  const featuredInstitutions = useMemo(() => institutions.filter((item) => item.featured), [institutions]);
  const visibleInstitutions = featuredInstitutions.length ? featuredInstitutions : institutions;
  const news = useMemo(() => content?.news ?? [], [content?.news]);
  const publishedNews = useMemo(() => getPublishedNews(news), [news]);
  const institutionFeedbackCards = useMemo(
    () =>
      visibleInstitutions.map((item, index) => {
        const embedUrl = getEmbedUrl(item.embed);

        return {
          id: item.id || `institution-${index}`,
          title: item.name,
          label: embedUrl ? "Institucion aliada · Embed" : item.link ? "Institucion aliada · Enlace" : "Institucion aliada",
          href: item.link || "",
          embedUrl,
          image: item.image || "",
          fallbackBody: "Esta institucion aparecera aqui cuando el administrador publique su vista principal.",
        };
      }),
    [visibleInstitutions]
  );
  const testimonials = useMemo(
    () => (content?.testimonials ?? []).filter((item) => !item.status || item.status === "approved"),
    [content?.testimonials]
  );
  const metrics = useMemo(() => hero.metrics ?? [], [hero.metrics]);
  const navLabels = landing.nav?.length
    ? landing.nav
    : ["Inicio", "Sobre nosotros", "Servicios", "Impacto", "Testimonios", "Contacto"];
  const navItems = useMemo(
    () =>
      navLabels.map((label) => ({
        label,
        id: slugifySectionLabel(label),
      })),
    [navLabels]
  );
  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? "inicio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [testimonialStartIndex, setTestimonialStartIndex] = useState(0);
  const featuredNews = publishedNews[0] ?? null;
  const secondaryNews = publishedNews.slice(1, 5);

  const rotatingTestimonials = useMemo(() => {
    if (testimonials.length <= 3) {
      return testimonials;
    }

    return Array.from({ length: 3 }, (_, offset) => testimonials[(testimonialStartIndex + offset) % testimonials.length]);
  }, [testimonialStartIndex, testimonials]);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll(".gobeyond-reveal").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sections.length) return undefined;

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: [0.15, 0.35, 0.55], rootMargin: "-20% 0px -45% 0px" }
    );

    sections.forEach((section) => sectionObserver.observe(section));
    return () => sectionObserver.disconnect();
  }, [navItems]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (testimonials.length <= 3) {
      setTestimonialStartIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTestimonialStartIndex((current) => (current + 1) % testimonials.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [testimonials]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
          <a className="flex items-center gap-3 min-w-0" href="#inicio">
            <img alt="Logo de GoBeyond" className="h-9 w-9 object-contain md:h-10 md:w-10" src="/logo-icon.png" />
            <span className="truncate text-[11px] sm:text-[12px] font-black uppercase tracking-[0.24em] sm:tracking-[0.3em]">
              {brand.name || "GoBeyond"}
            </span>
          </a>
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${activeSection === item.id ? 'text-blue-500' : 'text-gray-500 hover:text-white'}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu"
              className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10"
              onClick={() => setMobileMenuOpen((current) => !current)}
              type="button"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <button onClick={onRequestLogin} className="min-h-11 rounded-full bg-white px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-blue-600 hover:text-white transition-all">
              Ingresar
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="border-t border-white/5 bg-[#050505]/95 px-5 py-4 md:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  className={`rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] transition-all ${
                    activeSection === item.id ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300"
                  }`}
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        {/* HERO */}
        <section id="inicio" className="relative flex min-h-screen items-center pb-16 pt-28 sm:pb-20 sm:pt-32">
          <div className="container mx-auto grid items-center gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-1000 z-10">
              <SectionTag>{hero.eyebrow || "Aprende con nosotros"}</SectionTag>
              <h1 className="max-w-4xl text-[3rem] sm:text-[3.6rem] md:text-[5rem] lg:text-[6.2rem] font-[900] leading-[0.9] tracking-[-0.06em]">
                {hero.title || brand.tagline || brand.name}
              </h1>
              <p className="mt-8 max-w-xl text-sm sm:text-base md:text-lg text-gray-400 font-light leading-relaxed">
                {hero.description || brand.description}
              </p>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <a href="#contacto" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-blue-500 hover:shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 text-center">Empezar ahora</a>
                <a href="#servicios" className="px-8 py-4 bg-transparent text-white border border-white/10 font-bold rounded-xl text-sm transition-all hover:bg-white/5 text-center">Explorar catálogo</a>
              </div>

              {metrics.length ? (
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {metrics.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="rounded-[1.7rem] border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
                      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-blue-400">{item.label}</p>
                      <p className="mt-4 text-xl font-black tracking-tight text-white">{item.value}</p>
                      <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative flex h-[280px] items-center justify-center gobeyond-reveal opacity-0 transition-all duration-1000 delay-300 sm:h-[360px] md:h-[500px] lg:h-[600px]">
              <div className="h-full w-full max-w-[320px] sm:max-w-[420px] md:max-w-[560px] lg:max-w-[640px]">
                <Suspense fallback={<div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.35),rgba(5,5,5,0)_70%)]" />}>
                  <Visual3D />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE NOSOTROS */}
        <section id="sobre-nosotros" className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-6 md:px-8">
          <div className="grid gap-10 items-start lg:grid-cols-[0.95fr_1.05fr]">
            <div className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
              <SectionTag>{landing.aboutTitle || "Sobre nosotros"}</SectionTag>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
                {brand.tagline || brand.name}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
                {landing.aboutBody || brand.description}
              </p>
            </div>

            <GlassCard className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
              {landing.aboutBodyTwo ? (
                <p className="text-lg text-gray-300 font-light leading-relaxed">{landing.aboutBodyTwo}</p>
              ) : null}
              {benefits.length ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {benefits.map((item) => (
                    <div key={item} className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5">
                      <p className="text-sm leading-relaxed text-gray-400">{item}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </GlassCard>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-6 md:px-8">
          <div className="max-w-4xl gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
            <SectionTag>{landing.servicesTitle || "Nuestros servicios"}</SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
              {content?.subscription?.label || "Ruta de desarrollo continuo."}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
              {landing.relevanceBody || content?.subscription?.description}
            </p>
          </div>
          <div className="mt-14 sm:mt-16 lg:mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {learningPath.length ? learningPath.map((item, index) => (
              <GlassCard key={item.id || `${item.title}-${index}`} className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
                <Badge>{item.type}</Badge>
                <h3 className="text-2xl font-bold mt-6 mb-4">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.status}</p>
              </GlassCard>
            )) : (
              <div className="md:col-span-3">
                <EmptyState
                  body="Las rutas de aprendizaje publicadas desde admin apareceran aqui."
                  title="Sin servicios publicados"
                />
              </div>
            )}
          </div>
        </section>

        {/* PROGRAMAS Y CURSOS */}
        <section id="programas" className="py-20 sm:py-24 lg:py-32 bg-[#080808]">
          <div className="container mx-auto px-5 sm:px-6 md:px-8">
            <div className="text-center mb-20 gobeyond-reveal opacity-0 translate-y-10 transition-all">
              <SectionTag>{landing.coursesTitle || "Programas y cursos"}</SectionTag>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">Creados para el Impacto Real.</h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              {courses.length ? courses.map((course, index) => (
                <GlassCard
                  key={course.id || `${course.title}-${index}`}
                  className={`flex flex-col justify-between ${index === 0 ? "border-blue-500/20 bg-blue-600/[0.01]" : ""}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <Badge>{[course.format, course.duration].filter(Boolean).join(" · ")}</Badge>
                      <span className={`font-bold tracking-tighter text-2xl ${index === 0 ? "text-blue-500" : "text-gray-600"}`}>
                        {String(course.title ?? "").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black mb-4">{course.title}</h3>
                    {course.audience ? <p className="text-gray-400 text-sm mb-6 font-medium">{course.audience}</p> : null}
                    {course.description ? <p className="text-gray-500 leading-relaxed mb-8">{course.description}</p> : null}
                  </div>
                  {course.outcomes ? (
                    <div className="pt-6 border-t border-white/5">
                      <p className={`text-[10px] uppercase tracking-widest font-bold ${index === 0 ? "text-blue-400" : "text-gray-400"}`}>Resultados:</p>
                      <p className="text-sm text-gray-300 mt-2">{course.outcomes}</p>
                    </div>
                  ) : null}
                </GlassCard>
              )) : (
                <div className="lg:col-span-2">
                  <EmptyState
                    body="Los programas y cursos publicados desde admin apareceran aqui."
                    title="Sin cursos publicados"
                  />
                </div>
              )}
            </div>

            {liveSessions.length ? (
              <div className="mt-14 sm:mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liveSessions.map((item, index) => (
                  <div
                    key={item.id || `${item.title}-${index}`}
                    className="gobeyond-reveal rounded-[1.7rem] border border-white/8 bg-white/[0.02] p-6 opacity-0 translate-y-10 transition-all duration-700"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">{item.date}</p>
                    <h3 className="mt-4 text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm text-gray-500">{item.format}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* IMPACTO SOCIAL */}
        <section id="impacto" className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-6 md:px-8">
          <div className="grid gap-12 lg:gap-20 items-center lg:grid-cols-2">
            <div className="gobeyond-reveal opacity-0 -translate-x-10 transition-all duration-1000">
              <SectionTag>Impacto</SectionTag>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 sm:mb-10 leading-none">
                {landing.relevanceTitle || "Compromiso Social y Oportunidades Concretas."}
              </h2>
              <div className="space-y-8">
                {accessTimeline.length ? accessTimeline.map((item, index) => (
                  <div key={item.id || `${item.title}-${index}`} className="flex gap-6">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border font-bold ${
                      index === 0
                        ? "bg-blue-600/10 border-blue-600/20 text-blue-500"
                        : "bg-white/5 border-white/10 text-white"
                    }`}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    body="Los hitos de impacto publicados desde admin apareceran aqui."
                    title="Sin hitos de impacto"
                  />
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 gobeyond-reveal opacity-0 translate-x-10 transition-all duration-1000">
              {communityStats.length ? communityStats.map((item, index) => (
                <div key={item.id || `${item.label}-${index}`} className="p-8 border border-white/5 bg-white/[0.01] rounded-[2rem]">
                  <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">{item.label}</p>
                  <h3 className="text-2xl font-black tracking-tight text-white">{item.value}</h3>
                  <p className="mt-4 text-gray-500 text-xs leading-relaxed">{item.description}</p>
                </div>
              )) : (
                <div className="col-span-2">
                  <EmptyState
                    body="Las estadisticas publicadas desde admin apareceran aqui."
                    title="Sin indicadores publicados"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section id="testimonios" className="py-20 sm:py-24 lg:py-32 bg-[#080808]">
          <div className="container mx-auto px-5 sm:px-6 md:px-8">
            <div className="max-w-4xl gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
              <SectionTag>{landing.trustTitle || "Red de confianza"}</SectionTag>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
                {landing.testimonialTitle || "Testimonios"}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
                {brand.description}
              </p>
            </div>

            <div className="mt-14 sm:mt-16 lg:mt-20 grid gap-10 items-start xl:grid-cols-[1.02fr_0.98fr]">
              <div className="grid gap-8">
                {institutionFeedbackCards.length ? (
                  <EmbedFeedbackCarousel items={institutionFeedbackCards} title="Feedback visual" />
                ) : (
                  <EmptyState
                    body="Las instituciones aliadas publicadas desde admin apareceran aqui con su imagen, enlace o embed."
                    title="Sin instituciones publicadas"
                  />
                )}

                {publishedNews.length ? (
                  <div className="grid gap-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-400">Noticias</p>
                    {featuredNews ? (
                      <article className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30">
                        {getEmbedUrl(featuredNews.embed) ? (
                          <div className="h-[14rem] overflow-hidden bg-[#0b0f17] sm:h-[18rem] lg:h-[20rem]">
                            <EmbedFrame src={getEmbedUrl(featuredNews.embed)} title={featuredNews.title} />
                          </div>
                        ) : featuredNews.image ? (
                          <div className="aspect-[16/8] overflow-hidden bg-[#0b0f17]">
                            <img alt={featuredNews.title} className="h-full w-full object-cover" src={featuredNews.image} />
                          </div>
                        ) : (
                          <div className="aspect-[16/8] bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(8,8,8,0.95))]" />
                        )}
                        <div className="p-6 sm:p-7">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400">
                            {featuredNews.category || "Noticia"}
                            {featuredNews.featured ? " · Destacada" : " · Reciente"}
                            {featuredNews.publishedAt ? ` · ${new Date(featuredNews.publishedAt).toLocaleDateString("es-CR")}` : ""}
                          </p>
                          <h3 className="mt-4 text-3xl font-black tracking-tight text-white">{featuredNews.title}</h3>
                          {featuredNews.summary ? (
                            <p className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base">{featuredNews.summary}</p>
                          ) : null}
                          {featuredNews.link ? (
                            <a
                              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:gap-3 hover:text-blue-300"
                              href={featuredNews.link}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Ver referencia
                              <span>&rarr;</span>
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ) : null}

                    {secondaryNews.length ? (
                      <div className="grid gap-3">
                        {secondaryNews.map((item) => (
                          <article
                            key={item.id}
                            className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30"
                          >
                            <div className="grid gap-0 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                              {getEmbedUrl(item.embed) ? (
                                <div className="h-full min-h-[6.5rem] overflow-hidden bg-[#0b0f17]">
                                  <EmbedFrame src={getEmbedUrl(item.embed)} title={item.title} />
                                </div>
                              ) : item.image ? (
                                <div className="h-full min-h-[6.5rem] overflow-hidden bg-[#0b0f17]">
                                  <img alt={item.title} className="h-full w-full object-cover" src={item.image} />
                                </div>
                              ) : (
                                <div className="flex min-h-[6.5rem] items-center justify-center bg-white/[0.03] px-4 text-center text-[11px] text-gray-500">
                                  Publicacion editorial
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                  <p className="text-[9px] uppercase tracking-[0.22em] text-blue-400">
                                    {item.category || "Noticia"}
                                    {item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString("es-CR")}` : ""}
                                  </p>
                                  <h4 className="mt-2 text-base font-black tracking-tight text-white sm:text-[1.05rem]">{item.title}</h4>
                                  {item.summary ? (
                                    <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
                                      {truncateText(item.summary, 150)}
                                    </p>
                                  ) : null}
                                </div>
                                {item.link ? (
                                  <a
                                    className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:border-blue-500/30 hover:text-blue-300"
                                    href={item.link}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    Ver
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    <button
                      className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:border-blue-500/30 hover:bg-white/[0.06]"
                      onClick={onNavigateToNewsArchive}
                      type="button"
                    >
                      Ver mas noticias
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                {testimonials.length > 3 ? (
                  <div className="mb-2 flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">
                      Rotando testimonios
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Testimonio anterior"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-blue-500/30 hover:bg-white/[0.06]"
                        onClick={() =>
                          setTestimonialStartIndex((current) => (current - 1 + testimonials.length) % testimonials.length)
                        }
                        type="button"
                      >
                        ←
                      </button>
                      <button
                        aria-label="Siguiente testimonio"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-blue-500/30 hover:bg-white/[0.06]"
                        onClick={() => setTestimonialStartIndex((current) => (current + 1) % testimonials.length)}
                        type="button"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ) : null}

                {testimonials.length ? rotatingTestimonials.map((item, index) => {
                  const initials = String(item.author ?? "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("");

                  return (
                    <article
                      key={item.id || `${item.author}-${index}`}
                      className={`rounded-[1.9rem] border p-7 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 ${
                        index === 0 && rotatingTestimonials.length > 1
                          ? "border-l-4 border-l-blue-500 bg-white/[0.05] shadow-2xl"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <span className="mb-[-1.5rem] block font-['Georgia'] text-[5rem] leading-none text-blue-900 select-none">"</span>
                      <blockquote className="font-['Georgia'] text-[1.35rem] leading-relaxed text-white sm:text-[1.5rem]">
                        “{item.quote}”
                      </blockquote>
                      <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/10 text-sm font-semibold text-blue-200">
                          {initials}
                        </div>
                        <p className="min-w-0 text-xs uppercase tracking-[0.2em] text-white">
                          {item.author}
                          {item.organization ? <span className="mx-1.5 text-blue-200/50">·</span> : null}
                          <span className="text-gray-400">{item.organization}</span>
                        </p>
                      </div>
                    </article>
                  );
                }) : (
                  <EmptyState
                    body="Los testimonios aprobados desde admin apareceran aqui de forma automatica."
                    title="Sin testimonios publicados"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        <section id="contacto" className="py-20 sm:py-24 lg:py-32 bg-blue-600">
          <div className="container mx-auto px-5 sm:px-6 md:px-8">
            <div className="grid gap-12 items-start lg:grid-cols-[0.92fr_1.08fr]">
              <div className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
                <SectionTag>{landing.contactTitle || "Contacto"}</SectionTag>
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white">
                  {landing.contactBody || "Ponte en contacto con GoBeyond."}
                </h2>
                {brand.description ? (
                  <p className="mt-8 max-w-2xl text-base sm:text-lg md:text-xl text-blue-100 font-light leading-relaxed">{brand.description}</p>
                ) : null}

                {(landing.contactActions ?? []).length ? (
                  <div className="mt-12 grid gap-4 sm:grid-cols-2">
                    {landing.contactActions.map((item) => {
                      const href = getActionHref(item, news, institutions, socialLinks);
                      const external = isExternalHref(href);

                      return (
                        <a
                          key={item}
                          href={href}
                          rel={external ? "noreferrer" : undefined}
                          target={external ? "_blank" : undefined}
                          className="flex items-center justify-between rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/15"
                        >
                          <span>{item}</span>
                          <span>&rarr;</span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {createTestimonialSubmission ? (
                <div className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
                  <TestimonialSubmissionForm createTestimonialSubmission={createTestimonialSubmission} />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-5 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img alt="Logo de GoBeyond" className="h-7 w-7 object-contain" src="/logo-icon.png" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{brand.name || "GoBeyond Academy"}</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600">
            © {new Date().getFullYear()} {brand.name || "GoBeyond Academy"} · Formación de Alto Impacto · Puerto Limón, CR.
          </p>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        .gobeyond-reveal.is-visible {
          opacity: 1 !important;
          transform: translate(0, 0) !important;
        }
      `}</style>
    </div>
  );
}
