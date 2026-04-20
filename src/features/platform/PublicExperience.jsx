import { useEffect, useMemo, useState } from "react";
import { EmbedFeedbackCarousel } from "./components/EmbedFeedbackCarousel";
import HeroArcadePanel from "./components/HeroArcadePanel";
import { SecurityTurnstile } from "./components/SecurityTurnstile";
import { getDomainLabel, getEmbedDescriptor, normalizePublicMediaUrl } from "./embedUtils";
import { normalizeLearningPath } from "./learningPath";
import { getPublishedNews, normalizeSocialNewsItem } from "./newsUtils";
import { EMBED_IFRAME_ALLOW, EMBED_IFRAME_SANDBOX } from "../../shared/embedPolicy";
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

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  if (normalized.includes("instagram")) {
    return socialLinks?.instagram || externalReference || "#testimonios";
  }

  return "#inicio";
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

function getEmailHref(value) {
  const email = String(value ?? "").trim();
  return email ? `mailto:${email}` : "";
}

function getPhoneHref(value) {
  const phone = String(value ?? "").trim();
  const sanitizedPhone = phone.replace(/[^\d+]/g, "");
  return sanitizedPhone ? `tel:${sanitizedPhone}` : "";
}

function truncateText(value, maxLength) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

const defaultParticipationSection = {
  eyebrow: "Modalidades",
  title: "Formacion de alto valor, con acceso real.",
  description:
    "En Go Beyond combinamos programas 100% becados con esquemas accesibles para ampliar oportunidades, sostener el proyecto y multiplicar su impacto en mas jovenes e instituciones.",
  footnote:
    "Invertir en educacion de calidad no solo fortalece a las instituciones. Tambien transforma comunidades enteras.",
  detailsHref: "https://go-beyond0.webnode.cr/precios/",
  detailsLabel: "Ver mas detalles y condiciones",
};

const defaultParticipationOptions = [
  {
    id: "participation-independent",
    eyebrow: "Independiente",
    title: "Go Beyond 7",
    price: "$0",
    description:
      "Pensado para jovenes actualmente desempleados que quieren prepararse con habilidades de alto valor y dar un paso real hacia mejores oportunidades.",
    highlights: ["Para jovenes desempleados", "Cupos limitados", "Apertura sujeta a disponibilidad"],
    ctaLabel: "Aplicar como independiente",
    href: "https://form.jotform.com/252241086494054",
  },
  {
    id: "participation-public",
    eyebrow: "Instituciones publicas",
    title: "Hasta 10 estudiantes becados",
    price: "$0",
    description:
      "Las instituciones publicas pueden acceder a programas 100% becados. Si el grupo supera 10 estudiantes, se habilita una tarifa accesible por estudiante.",
    highlights: ["100% becado", "Hasta 10 estudiantes por programa", "Tarifa accesible si excede 10"],
    ctaLabel: "Aplicar como institucion educativa",
    href: "https://form.jotform.com/260358820111044",
  },
  {
    id: "participation-private",
    eyebrow: "Instituciones privadas",
    title: "Modelo accesible con impacto social",
    price: "USD",
    priceNote: "por estudiante / por programa",
    description:
      "Las instituciones privadas acceden a un modelo accesible que beneficia a sus estudiantes y contribuye directamente a la sostenibilidad de los programas becados.",
    highlights: ["5 becas completas por programa", "Minimo 10 estudiantes", "Costo accesible por estudiante"],
    ctaLabel: "Aplicar como institucion educativa",
    href: "https://form.jotform.com/260358820111044",
  },
];

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
      allow={EMBED_IFRAME_ALLOW}
      allowFullScreen
      className={`h-full w-full border-0 ${className}`}
      height="100%"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox={EMBED_IFRAME_SANDBOX}
      src={src}
      title={title}
      width="100%"
    />
  );
}

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
      <SecurityTurnstile
        action="public-testimonial"
        className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/10 p-3"
        onTokenChange={setTurnstileToken}
        resetKey={turnstileResetKey}
        siteKey={turnstileSiteKey}
      />
      <button
        className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-blue-600 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-60 sm:w-fit"
        disabled={submitting || (requiresTurnstile && !turnstileToken)}
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
export function PublicExperience({
  content,
  createTestimonialSubmission,
  noticiasPosts = [],
  noticiasLoading = false,
  noticiasError = "",
  onNavigateToNewsArchive,
  onRequestLogin,
}) {
  const landing = content?.landing ?? {};
  const contactInfo = landing?.contactInfo ?? {};
  const socialLinks = useMemo(
    () => ({
      facebook: landing?.socialLinks?.facebook ?? "",
      linkedin: landing?.socialLinks?.linkedin ?? "",
      instagram: landing?.socialLinks?.instagram ?? "",
    }),
    [landing?.socialLinks?.facebook, landing?.socialLinks?.linkedin, landing?.socialLinks?.instagram]
  );
  const hero = content?.hero ?? {};
  const brand = content?.brand ?? {};
  const benefits = useMemo(() => content?.benefits ?? [], [content?.benefits]);
  const learningPath = useMemo(() => normalizeLearningPath(content?.learningPath ?? []), [content?.learningPath]);
  const courses = useMemo(() => content?.courses ?? [], [content?.courses]);
  const liveSessions = useMemo(() => content?.liveSessions ?? [], [content?.liveSessions]);
  const participationSection = useMemo(() => content?.participationSection ?? defaultParticipationSection, [content?.participationSection]);
  const participationOptions = useMemo(
    () => (content?.participationOptions?.length ? content.participationOptions : defaultParticipationOptions),
    [content?.participationOptions]
  );
  const institutions = useMemo(() => content?.institutions ?? [], [content?.institutions]);
  const featuredInstitutions = useMemo(() => institutions.filter((item) => item.featured), [institutions]);
  const visibleInstitutions = featuredInstitutions.length ? featuredInstitutions : institutions;
  const news = useMemo(() => content?.news ?? [], [content?.news]);
  const publishedNews = useMemo(
    () => (noticiasPosts.length ? noticiasPosts.map((item) => normalizeSocialNewsItem(item)) : getPublishedNews(news)),
    [news, noticiasPosts]
  );
  const institutionFeedbackCards = useMemo(
    () =>
      visibleInstitutions.map((item, index) => {
        const embed = getEmbedDescriptor(item.embed);
        const href = item.link || embed.externalUrl || "";

        return {
          id: item.id || `institution-${index}`,
          title: item.name,
          label: embed.embedUrl ? "Institucion aliada · Embed" : href ? "Institucion aliada · Referencia" : "Institucion aliada",
          href,
          embedUrl: embed.embedUrl,
          domainLabel: getDomainLabel(href) || embed.domainLabel,
          image: normalizePublicMediaUrl(item.image),
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
  const featuredNewsEmbed = useMemo(() => getEmbedDescriptor(featuredNews?.embed), [featuredNews?.embed]);
  const secondaryNewsCards = useMemo(
    () =>
      secondaryNews.map((item) => {
        const embed = getEmbedDescriptor(item.embed);
        return {
          item: {
            ...item,
            image: normalizePublicMediaUrl(item.image),
          },
          embed,
          externalDomain: getDomainLabel(item.link || embed.externalUrl),
        };
      }),
    [secondaryNews]
  );

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
            <button onClick={onRequestLogin} className="min-h-11 rounded-full bg-white px-4 sm:px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-[#dbeafe] hover:text-[#1d4ed8] transition-all">
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
              <MarkdownContent className="mt-8 max-w-xl text-sm sm:text-base md:text-lg text-gray-400 font-light leading-relaxed">
                {hero.description || brand.description}
              </MarkdownContent>
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
                <HeroArcadePanel />
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
              <MarkdownContent className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
                {landing.aboutBody || brand.description}
              </MarkdownContent>
            </div>

            <GlassCard className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
              {landing.aboutBodyTwo ? (
                <MarkdownContent className="text-lg text-gray-300 font-light leading-relaxed">{landing.aboutBodyTwo}</MarkdownContent>
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
            <MarkdownContent className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
              {landing.relevanceBody || content?.subscription?.description}
            </MarkdownContent>
          </div>
          <div className="mt-14 sm:mt-16 lg:mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {learningPath.length ? learningPath.map((item, index) => (
              <GlassCard key={item.id || `${item.title}-${index}`} className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
                <Badge>{item.track}</Badge>
                <h3 className="text-2xl font-bold mt-6 mb-4">{item.title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{item.stageLabel}</p>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{item.description}</p>
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
              {courses.length ? courses.map((course, index) => {
                const courseImage = normalizePublicMediaUrl(course.coverImage || course.image || "");
                const initials = String(course.title ?? "")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("");

                return (
                  <GlassCard
                    key={course.id || `${course.title}-${index}`}
                    className={`flex flex-col justify-between overflow-hidden ${index === 0 ? "border-blue-500/20 bg-blue-600/[0.01]" : ""}`}
                  >
                    <div>
                      <div className="mb-8 overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#0b0f17]">
                        {courseImage ? (
                          <img alt={course.title} className="h-56 w-full object-cover" src={courseImage} />
                        ) : (
                          <div className="relative flex h-56 w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),rgba(12,18,32,0.95)_58%)] p-6">
                            <div className="absolute right-5 top-5 text-5xl font-black tracking-tighter text-white/12">
                              {initials || "GB"}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-300">Go Beyond</p>
                              <p className="mt-3 max-w-[14rem] text-lg font-semibold leading-tight text-white">
                                Imagen del curso disponible al publicar una portada desde admin.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start mb-8 gap-4">
                        <Badge>{[course.format, course.duration].filter(Boolean).join(" · ")}</Badge>
                        <span className={`font-bold tracking-tighter text-2xl ${index === 0 ? "text-blue-500" : "text-gray-600"}`}>
                          {initials || "GB"}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black mb-4">{course.title}</h3>
                      {course.audience ? <p className="text-gray-400 text-sm mb-6 font-medium">{course.audience}</p> : null}
                      {course.description ? (
                        <MarkdownContent className="mb-8 text-gray-500 leading-relaxed">{course.description}</MarkdownContent>
                      ) : null}
                    </div>
                    {course.outcomes ? (
                      <div className="pt-6 border-t border-white/5">
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${index === 0 ? "text-blue-400" : "text-gray-400"}`}>Resultados:</p>
                        <MarkdownContent className="mt-2 text-sm text-gray-300">{course.outcomes}</MarkdownContent>
                      </div>
                    ) : null}
                  </GlassCard>
                );
              }) : (
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

        {/* MODALIDADES DE PARTICIPACION */}
        <section id="impacto" className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-6 md:px-8">
          <div className="max-w-4xl gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
            <SectionTag>{participationSection.eyebrow || "Modalidades"}</SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
              {participationSection.title || "Formacion de alto valor, con acceso real."}
            </h2>
            <MarkdownContent className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
              {participationSection.description}
            </MarkdownContent>
          </div>

          <div className="mt-14 sm:mt-16 lg:mt-20 grid gap-6 xl:grid-cols-3">
            {participationOptions.map((item, index) => {
              const external = isExternalHref(item.href);

              return (
                <GlassCard
                  key={item.id || `${item.title}-${index}`}
                  className={`gobeyond-reveal flex h-full flex-col justify-between opacity-0 translate-y-10 transition-all duration-700 ${
                    index === 0 ? "border-blue-500/25 bg-blue-600/[0.04]" : ""
                  }`}
                >
                    <div>
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Badge>{item.eyebrow}</Badge>
                          <h3 className="mt-6 text-2xl font-black tracking-tight text-white sm:text-[2rem]">{item.title}</h3>
                        </div>
                        <div className="border-t border-white/10 pt-5 text-left sm:shrink-0 sm:border-t-0 sm:pt-0 sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">Costo</p>
                          <p className="mt-3 text-4xl font-black tracking-tight text-white">{item.price}</p>
                          {item.priceNote ? (
                            <p className="mt-2 max-w-[13rem] text-[11px] uppercase leading-relaxed tracking-[0.18em] text-gray-500 sm:ml-auto">
                              {item.priceNote}
                            </p>
                          ) : null}
                        </div>
                      </div>

                    <MarkdownContent className="mt-8 text-sm leading-relaxed text-gray-400">{item.description}</MarkdownContent>

                    {item.highlights?.length ? (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {item.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-200"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <a
                    className="mt-10 inline-flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:border-blue-500/30 hover:bg-white/[0.08] hover:text-blue-200"
                    href={item.href}
                    rel={external ? "noreferrer" : undefined}
                    target={external ? "_blank" : undefined}
                  >
                    <span>{item.ctaLabel}</span>
                    <span>&rarr;</span>
                  </a>
                </GlassCard>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="gobeyond-reveal rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 opacity-0 translate-y-10 transition-all duration-700">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">Cierre</p>
              <MarkdownContent className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300">
                {participationSection.footnote}
              </MarkdownContent>
            </div>
            <a
              className="gobeyond-reveal flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 opacity-0 translate-y-10 transition-all duration-700 hover:border-blue-500/30 hover:bg-white/[0.06]"
              href={participationSection.detailsHref}
              rel="noreferrer"
              target="_blank"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">Mas detalles</p>
                <p className="mt-3 text-lg font-semibold text-white">{participationSection.detailsLabel}</p>
              </div>
              <span className="text-xl text-white">&rarr;</span>
            </a>
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
              <MarkdownContent className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light">
                {brand.description}
              </MarkdownContent>
            </div>

            <div className="mt-14 sm:mt-16 lg:mt-20 grid gap-10 items-start xl:grid-cols-[1.02fr_0.98fr]">
              <div className="grid gap-8">
                {institutionFeedbackCards.length ? (
                  <EmbedFeedbackCarousel items={institutionFeedbackCards} />
                ) : (
                  <EmptyState
                    body="Las instituciones aliadas publicadas desde admin apareceran aqui con su imagen, enlace o embed."
                    title="Sin instituciones publicadas"
                  />
                )}

                {noticiasLoading ? (
                  <EmptyState
                    body="Estamos consultando las publicaciones mas recientes de Facebook y LinkedIn."
                    title="Cargando noticias"
                  />
                ) : noticiasError ? (
                  <EmptyState
                    body={noticiasError}
                    title="No pudimos cargar las noticias automaticas"
                  />
                ) : publishedNews.length ? (
                  <div className="grid gap-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-400">Noticias</p>
                    {featuredNews ? (
                      <article className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30">
                        <div className="aspect-[16/8] overflow-hidden bg-[#0b0f17]">
                          <PublicImageWithFallback
                            alt={featuredNews.title}
                            className="h-full w-full object-cover"
                            fallback={
                              featuredNewsEmbed.embedUrl ? (
                                <EmbedFrame src={featuredNewsEmbed.embedUrl} title={featuredNews.title} />
                              ) : (
                                <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(8,8,8,0.95))] p-6">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-blue-300">
                                    {getDomainLabel(featuredNews.link || featuredNewsEmbed.externalUrl) || "Referencia externa"}
                                  </p>
                                  <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-300">
                                    Este contenido se abre mejor como referencia externa. GoBeyond muestra aqui una vista editorial para evitar iframes bloqueados.
                                  </p>
                                </div>
                              )
                            }
                            src={featuredNews.image}
                          />
                        </div>
                        <div className="p-6 sm:p-7">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400">
                            {featuredNews.source || featuredNews.category || "Noticia"}
                            {featuredNews.featured ? " · Destacada" : " · Reciente"}
                            {featuredNews.publishedAt ? ` · ${new Date(featuredNews.publishedAt).toLocaleDateString("es-CR")}` : ""}
                          </p>
                          <h3 className="mt-4 text-3xl font-black tracking-tight text-white">{featuredNews.title}</h3>
                          {featuredNews.summary ? (
                            <MarkdownContent className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base">{featuredNews.summary}</MarkdownContent>
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

                    {secondaryNewsCards.length ? (
                      <div className="grid gap-3">
                        {secondaryNewsCards.map(({ item, embed, externalDomain }) => (
                          <article
                            key={item.id}
                            className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30"
                          >
                            <div className="grid gap-0 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                              <div className="h-full min-h-[6.5rem] overflow-hidden bg-[#0b0f17]">
                                <PublicImageWithFallback
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                  fallback={
                                    embed.embedUrl ? (
                                      <EmbedFrame src={embed.embedUrl} title={item.title} />
                                    ) : (
                                      <div className="flex h-full min-h-[6.5rem] flex-col items-center justify-center bg-white/[0.03] px-4 text-center">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-300">
                                          {externalDomain || "Referencia"}
                                        </p>
                                        <p className="mt-2 text-[11px] text-gray-500">
                                          Vista externa
                                        </p>
                                      </div>
                                    )
                                  }
                                  src={item.image}
                                />
                              </div>
                              <div className="flex items-center justify-between gap-4 p-4">
                                <div className="min-w-0">
                                  <p className="text-[9px] uppercase tracking-[0.22em] text-blue-400">
                                    {item.source || item.category || "Noticia"}
                                    {item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString("es-CR")}` : ""}
                                  </p>
                                  <h4 className="mt-2 text-base font-black tracking-tight text-white sm:text-[1.05rem]">{item.title}</h4>
                                  {item.summary ? (
                                    <MarkdownContent className="mt-2 text-[13px] leading-relaxed text-gray-400">
                                      {truncateText(item.summary, 150)}
                                    </MarkdownContent>
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
                        <MarkdownContent>{item.quote}</MarkdownContent>
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
        <section id="contacto" className="py-20 sm:py-24 lg:py-32 bg-[#1d4ed8]">
          <div className="container mx-auto px-5 sm:px-6 md:px-8">
            <div className="grid gap-12 items-start lg:grid-cols-[0.92fr_1.08fr]">
              <div className="gobeyond-reveal opacity-0 translate-y-10 transition-all duration-700">
                <SectionTag>{landing.contactTitle || "Contacto"}</SectionTag>
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white">
                  {landing.contactBody || "Ponte en contacto con GoBeyond."}
                </h2>
                {brand.description ? (
                  <MarkdownContent className="mt-8 max-w-2xl text-base sm:text-lg md:text-xl text-blue-100 font-light leading-relaxed">{brand.description}</MarkdownContent>
                ) : null}

                {(contactInfo.emailValue || contactInfo.phoneValue) ? (
                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {contactInfo.emailValue ? (
                      <a
                        className="rounded-[1.6rem] border border-white/15 bg-white/10 px-5 py-5 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15"
                        href={getEmailHref(contactInfo.emailValue)}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100">
                          {contactInfo.emailLabel || "Email"}
                        </p>
                        <p className="mt-4 text-lg font-semibold leading-snug">{contactInfo.emailValue}</p>
                      </a>
                    ) : null}
                    {contactInfo.phoneValue ? (
                      <a
                        className="rounded-[1.6rem] border border-white/15 bg-white/10 px-5 py-5 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15"
                        href={getPhoneHref(contactInfo.phoneValue)}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100">
                          {contactInfo.phoneLabel || "Telefono"}
                        </p>
                        <p className="mt-3 text-sm font-medium text-blue-100/85">
                          {contactInfo.phonePrompt || "Llamanos"}
                        </p>
                        <p className="mt-2 text-lg font-semibold leading-snug">{contactInfo.phoneValue}</p>
                      </a>
                    ) : null}
                  </div>
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
                  <TestimonialSubmissionForm
                    createTestimonialSubmission={createTestimonialSubmission}
                    turnstileSiteKey={content?.securityPublic?.siteKey ?? ""}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto grid gap-8 px-5 sm:px-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <img alt="Logo de GoBeyond" className="h-7 w-7 object-contain" src="/logo-icon.png" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{brand.name || "GoBeyond Academy"}</span>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-600">
              © {new Date().getFullYear()} {brand.name || "GoBeyond Academy"} · Formación de Alto Impacto · Puerto Limón, CR.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:justify-items-end">
            {legalFooterLinks.map((item) => (
              <a
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 transition hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
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
