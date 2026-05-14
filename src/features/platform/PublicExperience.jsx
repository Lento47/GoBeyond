import { useEffect, useMemo, useState } from "react";
import HeroArcadePanel from "./components/HeroArcadePanel";
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

const DEFAULT_NAV = [
  "Inicio",
  "Sobre nosotros",
  "Servicios",
  "Cursos",
  "Instituciones",
  "Testimonios",
  "Noticias",
  "Contacto",
];

// ─── Pure helpers ────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function isSixSigmaItem(item) {
  return normalizeText(item?.title).includes("six sigma");
}

function removeSixSigma(value) {
  return typeof value === "string" ? value.replace(/Six Sigma/gi, "IA") : value;
}

function normalizeMetric(item) {
  return {
    ...item,
    label: removeSixSigma(item?.label),
    value: removeSixSigma(item?.value),
    description: removeSixSigma(item?.description),
  };
}

function getContactActionHref(label, news, institutions, socialLinks) {
  const n = normalizeText(label);
  const ref = [...(news ?? []), ...(institutions ?? [])].find((i) => i?.link)?.link;
  if (n.includes("noticia")) return "/noticias";
  if (n.includes("contact")) return "#contacto";
  if (n.includes("facebook")) return socialLinks?.facebook || ref || "#instituciones";
  if (n.includes("linkedin")) return socialLinks?.linkedin || ref || "#instituciones";
  if (n.includes("instagram")) return socialLinks?.instagram || ref || "#instituciones";
  return "#inicio";
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

function getEmailHref(v) {
  const e = String(v ?? "").trim();
  return e ? `mailto:${e}` : "";
}

function getPhoneHref(v) {
  const p = String(v ?? "").trim().replace(/[^\d+]/g, "");
  return p ? `tel:${p}` : "";
}

function truncate(value, max) {
  const s = String(value ?? "").trim();
  return s.length <= max ? s : `${s.slice(0, max).trimEnd()}…`;
}

function shortBrand(name) {
  return (String(name ?? "").trim().split(":")[0].trim()) || "GoBeyond";
}

function getInitials(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Atomic components ───────────────────────────────────────────────────────

const SectionTag = ({ children }) => (
  <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.46em] text-blue-500">
    {children}
  </span>
);

const Badge = ({ children }) => (
  <span className="inline-block rounded-full border border-blue-600/20 bg-blue-600/8 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
    {children}
  </span>
);

const LandingCard = ({ children, className = "", highlight = false }) => (
  <div
    className={`rounded-2xl border p-6 transition-colors ${
      highlight
        ? "border-blue-500/20 bg-blue-600/[0.03]"
        : "border-white/8 bg-white/[0.02] hover:border-white/14"
    } ${className}`}
  >
    {children}
  </div>
);

function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-gray-500">
      <p className="font-semibold text-white/70">{title}</p>
      {body ? <p className="mt-2 leading-relaxed">{body}</p> : null}
    </div>
  );
}

function EmbedFrame({ src, title }) {
  return (
    <iframe
      allow={EMBED_IFRAME_ALLOW}
      allowFullScreen
      className="h-full w-full border-0"
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

// Max 3 highlights from a program card's list fields
function ProgramHighlights({ program }) {
  const items = [
    ...(Array.isArray(program.outcomes) ? program.outcomes : []),
    ...(Array.isArray(program.includes) ? program.includes : []),
    ...(Array.isArray(program.benefits) ? program.benefits : []),
  ]
    .filter((item) => String(item ?? "").trim())
    .slice(0, 3);

  if (!items.length) return null;

  return (
    <ul className="mt-4 grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-400">
          <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/60" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Clean logo card for institutions — white surface, object-contain, safe fallback
function InstitutionLogoCard({ institution }) {
  const image = normalizePublicMediaUrl(institution.image);
  const initials = getInitials(institution.name);
  const shortName = String(institution.name ?? "").trim().split(" ").slice(0, 2).join(" ");

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <PublicImageWithFallback
          alt={institution.name}
          className="h-full w-full object-contain"
          src={image}
          fallback={
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <span className="text-2xl font-black text-gray-300">{initials || "GB"}</span>
            </div>
          }
        />
      </div>
      <p className="text-center text-[11px] font-semibold leading-tight tracking-wide text-gray-400">
        {shortName || institution.name}
      </p>
    </div>
  );
}

// For institutions that have embeds, we still use the carousel (fixed elsewhere)
// Institutions always render as a logo grid — social embed URLs (LinkedIn,
// Facebook, etc.) are valid for news but not for institution logo cards since
// those platforms block external iframes. The embed field is ignored here.
function InstitutionsDisplay({ institutions }) {
  const cols =
    institutions.length <= 2
      ? "grid-cols-2"
      : institutions.length <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`grid gap-5 ${cols}`}>
      {institutions.map((item, index) => (
        <InstitutionLogoCard key={item.id || index} institution={item} />
      ))}
    </div>
  );
}

// ─── Section components ──────────────────────────────────────────────────────

function HeroSection({ hero, brand, landing, metrics }) {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center pb-16 pt-28 sm:pb-20 sm:pt-32"
    >
      <div className="container mx-auto grid items-center gap-10 px-5 sm:px-6 lg:px-8 lg:grid-cols-2">
        {/* Text — always visible, no reveal on above-the-fold content */}
        <div className="z-10">
          <SectionTag>{hero.eyebrow || "Aprende con nosotros"}</SectionTag>
          <h1 className="text-[clamp(2.4rem,7.5vw,5.8rem)] font-[900] leading-[0.9] tracking-[-0.05em] break-words">
            {hero.title || brand.name}
          </h1>
          <MarkdownContent className="mt-7 max-w-xl text-base sm:text-lg text-gray-400 font-light leading-relaxed">
            {hero.description}
          </MarkdownContent>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-500 hover:-translate-y-0.5 active:scale-95"
            >
              {landing.heroPrimaryCtaLabel || "Empezar ahora"}
            </a>
            <a
              href="#cursos"
              className="inline-flex items-center justify-center rounded-xl border border-white/12 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/5 hover:-translate-y-0.5 active:scale-95"
            >
              {landing.heroSecondaryCtaLabel || "Ver programas"}
            </a>
          </div>

          {metrics.length ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((item, i) => (
                <div
                  key={`${item.label}-${i}`}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-black tracking-tight text-white">{item.value}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Visual */}
        <div className="gobeyond-reveal relative flex h-[260px] items-center sm:h-[360px] md:h-[480px] lg:h-[560px]">
          <div className="h-full w-full">
            <HeroArcadePanel />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ landing, brand, benefits }) {
  return (
    <section id="sobre-nosotros" className="py-24 sm:py-28 lg:py-32 bg-[#080808]">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-2 items-start">
          <div className="gobeyond-reveal">
            <SectionTag>{landing.aboutTitle || "Sobre nosotros"}</SectionTag>
            <h2 className="text-[clamp(1.9rem,4.5vw,4rem)] font-black tracking-tighter leading-[0.95] break-words">
              {landing.aboutHeading || brand.tagline}
            </h2>
            <MarkdownContent className="mt-6 text-base sm:text-lg text-gray-500 leading-relaxed font-light">
              {landing.aboutBodyTwo || landing.aboutBody || brand.description}
            </MarkdownContent>
          </div>

          {benefits.length ? (
            <div className="gobeyond-reveal grid gap-3 sm:grid-cols-2">
              {benefits.map((item, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <MarkdownContent className="text-sm leading-relaxed text-gray-300 break-words">{item}</MarkdownContent>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ landing, content, learningPath }) {
  return (
    <section id="servicios" className="py-24 sm:py-28 lg:py-32">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl gobeyond-reveal">
          <SectionTag>{landing.servicesTitle || "Nuestros servicios"}</SectionTag>
          <h2 className="text-[clamp(1.9rem,4.5vw,4rem)] font-black tracking-tighter leading-[0.95] break-words">
            {landing.subscriptionLabel ||
              content?.subscription?.label ||
              "Ruta de desarrollo continuo."}
          </h2>
          <MarkdownContent className="mt-6 text-base sm:text-lg text-gray-500 leading-relaxed font-light">
            {landing.relevanceBody || content?.subscription?.description}
          </MarkdownContent>
        </div>

        <div className="mt-12 lg:mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {learningPath.length ? (
            learningPath.map((item, i) => (
              <LandingCard key={item.id || i} className="gobeyond-reveal flex flex-col">
                <Badge>{item.track}</Badge>
                <h3 className="mt-4 text-xl font-bold tracking-tight break-words">{item.title}</h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {item.stageLabel}
                </p>
                <MarkdownContent className="mt-3 flex-1 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </MarkdownContent>
              </LandingCard>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                body="Las rutas de aprendizaje publicadas desde admin apareceran aqui."
                title="Sin servicios publicados"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CoursesSection({ landing, programCards, courses, liveSessions }) {
  const hasCourseContent = programCards.length || courses.length;

  return (
    <section id="cursos" className="py-24 sm:py-28 lg:py-32 bg-[#080808]">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14 gobeyond-reveal">
          <SectionTag>{landing.coursesTitle || "Programas y cursos"}</SectionTag>
          <h2 className="text-[clamp(1.9rem,4.5vw,4rem)] font-black tracking-tighter leading-[0.95]">
            {landing.coursesHeading || "Creados para el Impacto Real."}
          </h2>
        </div>

        {hasCourseContent ? (
          <>
            {courses.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c, i) => (
                  <CourseCard key={c.id || i} course={c} index={i} landing={landing} />
                ))}
              </div>
            ) : null}

            {programCards.length ? (
              <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${courses.length ? "mt-8" : ""}`}>
                {programCards.map((p, i) => (
                  <ProgramCard key={p.id || i} program={p} index={i} landing={landing} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            body="Los programas y cursos publicados desde admin apareceran aqui."
            title="Sin cursos publicados"
          />
        )}

        {liveSessions.length ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveSessions.map((item, i) => (
              <div key={item.id || i} className="gobeyond-reveal rounded-xl border border-white/8 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-blue-400">
                  {item.date}
                </p>
                <h3 className="mt-3 text-lg font-bold text-white break-words">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.format}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProgramCard({ program, index, landing }) {
  const external = isExternalHref(program.href);
  const image = normalizePublicMediaUrl(program.image || "");
  const initials = getInitials(program.title);

  return (
    <LandingCard
      highlight={index === 0}
      className="gobeyond-reveal flex flex-col justify-between"
    >
      <div>
        {/* Cover */}
        <div className="mb-5 overflow-hidden rounded-xl border border-white/8 bg-[#0b0f17]">
          {image ? (
            <img alt={program.title} className="h-40 w-full object-cover" src={image} />
          ) : (
            <div className="relative flex h-40 w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),rgba(10,14,24,0.95)_60%)] p-4">
              <div className="absolute right-3 top-3 text-3xl font-black text-white/8">
                {initials || "GB"}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-blue-400">
                Go Beyond
              </p>
            </div>
          )}
        </div>

        {program.eyebrow ? <Badge>{program.eyebrow}</Badge> : null}
        <h3 className="mt-4 text-xl font-black leading-tight tracking-tight text-white break-words">
          {program.title}
        </h3>

        {program.description ? (
          <MarkdownContent className="mt-3 text-sm leading-relaxed text-gray-400 break-words">
            {truncate(program.description, 200)}
          </MarkdownContent>
        ) : null}

        {program.relevance ? (
          <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.04] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">¿Por qué es relevante?</p>
            <MarkdownContent className="mt-2 text-sm leading-relaxed text-gray-200">
              {truncate(program.relevance, 200)}
            </MarkdownContent>
          </div>
        ) : null}

        <ProgramHighlights program={program} />

        {program.certificationNote ? (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
            {program.certificationNote}
          </p>
        ) : null}
      </div>

      <a
        className="mt-6 inline-flex items-center justify-between rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:border-blue-500/25 hover:text-blue-300"
        href={program.href || "#contacto"}
        rel={external ? "noreferrer" : undefined}
        target={external ? "_blank" : undefined}
      >
        <span>{program.ctaLabel || "Aplicar"}</span>
        <span>&rarr;</span>
      </a>
    </LandingCard>
  );
}

function CourseCard({ course, index, landing }) {
  const image = normalizePublicMediaUrl(course.coverImage || course.image || "");
  const initials = getInitials(course.title);

  return (
    <LandingCard
      highlight={index === 0}
      className="gobeyond-reveal flex flex-col justify-between"
    >
      <div>
        <div className="mb-5 overflow-hidden rounded-xl border border-white/8 bg-[#0b0f17]">
          {image ? (
            <img alt={course.title} className="h-40 w-full object-cover" src={image} />
          ) : (
            <div className="relative flex h-40 w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),rgba(10,14,24,0.95)_60%)] p-4">
              <div className="absolute right-3 top-3 text-3xl font-black text-white/8">
                {initials || "GB"}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-blue-300">
                Go Beyond
              </p>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          {(course.format || course.duration) ? (
            <Badge>{[course.format, course.duration].filter(Boolean).join(" · ")}</Badge>
          ) : null}
          <span className={`shrink-0 text-lg font-black tracking-tighter ${index === 0 ? "text-blue-500" : "text-gray-600"}`}>
            {initials || "GB"}
          </span>
        </div>

        <h3 className="text-xl font-black tracking-tight break-words">{course.title}</h3>
        {course.audience ? (
          <p className="mt-2 text-sm font-medium text-gray-400 break-words">{truncate(course.audience, 120)}</p>
        ) : null}
        {course.description ? (
          <MarkdownContent className="mt-3 text-sm leading-relaxed text-gray-500 break-words">
            {truncate(course.description, 200)}
          </MarkdownContent>
        ) : null}
      </div>

      {course.outcomes ? (
        <div className="mt-5 border-t border-white/5 pt-4">
          <p className={`text-[10px] uppercase tracking-widest font-bold ${index === 0 ? "text-blue-400" : "text-gray-400"}`}>
            {landing.courseResultsLabel || "Resultados:"}
          </p>
          <MarkdownContent className="mt-2 text-sm text-gray-400 leading-relaxed">
            {course.outcomes}
          </MarkdownContent>
        </div>
      ) : null}
    </LandingCard>
  );
}

function InstitutionsSection({ landing, visibleInstitutions }) {
  if (!visibleInstitutions.length) return null;

  return (
    <section id="instituciones" className="py-24 sm:py-28 lg:py-32">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 gobeyond-reveal">
          <SectionTag>
            {landing.institutionsCarouselTitle || "Instituciones con convenio"}
          </SectionTag>
          {landing.institutionsCarouselBody ? (
            <MarkdownContent className="text-base sm:text-lg leading-relaxed text-gray-500 font-light">
              {landing.institutionsCarouselBody}
            </MarkdownContent>
          ) : null}
        </div>

        <div className="gobeyond-reveal">
          <InstitutionsDisplay institutions={visibleInstitutions} />
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({
  landing,
  brand,
  testimonials,
  rotatingTestimonials,
  testimonialStartIndex,
  setTestimonialStartIndex,
}) {
  return (
    <section id="testimonios" className="py-24 sm:py-28 lg:py-32 bg-[#080808]">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl gobeyond-reveal">
          <SectionTag>{landing.trustTitle || "Confian en nosotros"}</SectionTag>
          <h2 className="text-[clamp(1.9rem,4.5vw,4rem)] font-black tracking-tighter leading-[0.95] break-words">
            {landing.testimonialTitle || "Testimonios"}
          </h2>
          <MarkdownContent className="mt-6 text-base sm:text-lg text-gray-500 leading-relaxed font-light">
            {landing.trustBody || brand.description}
          </MarkdownContent>
        </div>

        <div className="mt-12 lg:mt-16">
          {testimonials.length > 3 ? (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-blue-400">
                {landing.testimonialsCarouselLabel || "Rotando testimonios"}
              </p>
              <div className="flex gap-2">
                <button
                  aria-label="Testimonio anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/20"
                  onClick={() =>
                    setTestimonialStartIndex(
                      (c) => (c - 1 + testimonials.length) % testimonials.length
                    )
                  }
                  type="button"
                >
                  ←
                </button>
                <button
                  aria-label="Siguiente testimonio"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/20"
                  onClick={() =>
                    setTestimonialStartIndex((c) => (c + 1) % testimonials.length)
                  }
                  type="button"
                >
                  →
                </button>
              </div>
            </div>
          ) : null}

          {testimonials.length ? (
            <div className="grid gap-5 xl:grid-cols-3">
              {rotatingTestimonials.map((item, i) => {
                const initials = getInitials(item.author);
                const isFirst = i === 0 && rotatingTestimonials.length > 1;
                return (
                  <article
                    key={item.id || `${item.author}-${i}`}
                    className={`rounded-2xl border p-7 transition-colors ${
                      isFirst
                        ? "border-l-4 border-l-blue-500 border-t-white/8 border-r-white/8 border-b-white/8 bg-white/[0.04]"
                        : "border-white/8 bg-white/[0.02]"
                    }`}
                  >
                    <span className="block font-serif text-[3.5rem] leading-none text-blue-900 select-none -mb-3">
                      "
                    </span>
                    <blockquote className="font-serif text-lg leading-relaxed text-white break-words sm:text-xl">
                      <MarkdownContent>{item.quote}</MarkdownContent>
                    </blockquote>
                    <div className="mt-5 flex items-center gap-3 border-t border-white/8 pt-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/25 bg-blue-600/8 text-xs font-semibold text-blue-300">
                        {initials}
                      </div>
                      <p className="min-w-0 text-xs uppercase tracking-[0.18em] text-white/80 truncate">
                        {item.author}
                        {item.organization ? (
                          <>
                            <span className="mx-1.5 text-white/25">·</span>
                            <span className="text-gray-400">{item.organization}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              body="Los testimonios aprobados desde admin apareceran aqui."
              title="Sin testimonios publicados"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function NewsLandingSection({
  landing,
  publishedNews,
  featuredNews,
  featuredNewsEmbed,
  secondaryNewsCards,
  noticiasLoading,
  noticiasError,
  onNavigateToNewsArchive,
}) {
  if (noticiasLoading) {
    return (
      <section id="noticias" className="py-24 sm:py-28 lg:py-32">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <EmptyState title="Cargando noticias" body="Consultando publicaciones recientes…" />
        </div>
      </section>
    );
  }

  if (noticiasError) {
    return (
      <section id="noticias" className="py-24 sm:py-28 lg:py-32">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <EmptyState title="No pudimos cargar las noticias" body={noticiasError} />
        </div>
      </section>
    );
  }

  if (!publishedNews.length) {
    // Don't render a hole — just a minimal anchor section
    return <div id="noticias" aria-hidden="true" />;
  }

  return (
    <section id="noticias" className="py-24 sm:py-28 lg:py-32">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 gobeyond-reveal">
          <SectionTag>{landing.newsTitle || "Noticias"}</SectionTag>
        </div>

        <div className="grid gap-6">
          {featuredNews ? (
            <article className="gobeyond-reveal overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-colors hover:border-white/14">
              <div className="aspect-[16/8] overflow-hidden bg-[#0b0f17]">
                <PublicImageWithFallback
                  alt={featuredNews.title}
                  className="h-full w-full object-cover"
                  fallback={
                    featuredNewsEmbed.embedUrl ? (
                      <EmbedFrame src={featuredNewsEmbed.embedUrl} title={featuredNews.title} />
                    ) : (
                      <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(8,8,8,0.96))] p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">
                          {getDomainLabel(featuredNews.link || featuredNewsEmbed.externalUrl) ||
                            "Referencia externa"}
                        </p>
                      </div>
                    )
                  }
                  src={featuredNews.image}
                />
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-[10px] uppercase tracking-[0.26em] text-blue-400">
                  {featuredNews.source || featuredNews.category || "Noticia"}
                  {featuredNews.publishedAt
                    ? ` · ${new Date(featuredNews.publishedAt).toLocaleDateString("es-CR")}`
                    : ""}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl break-words">
                  {featuredNews.title}
                </h3>
                {featuredNews.summary ? (
                  <MarkdownContent className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
                    {featuredNews.summary}
                  </MarkdownContent>
                ) : null}
                {featuredNews.link ? (
                  <a
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:gap-3 hover:text-blue-300"
                    href={featuredNews.link}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver referencia <span>&rarr;</span>
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
                  className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] transition-colors hover:border-white/14"
                >
                  <div className="grid sm:grid-cols-[5.5rem_minmax(0,1fr)]">
                    <div className="h-full min-h-[5.5rem] overflow-hidden bg-[#0b0f17]">
                      <PublicImageWithFallback
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallback={
                          embed.embedUrl ? (
                            <EmbedFrame src={embed.embedUrl} title={item.title} />
                          ) : (
                            <div className="flex h-full min-h-[5.5rem] items-center justify-center bg-white/[0.02]">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                                {externalDomain || "Ref."}
                              </p>
                            </div>
                          )
                        }
                        src={item.image}
                      />
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400">
                          {item.source || item.category || "Noticia"}
                        </p>
                        <h4 className="mt-1 truncate text-base font-black tracking-tight text-white">
                          {item.title}
                        </h4>
                        {item.summary ? (
                          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                            {truncate(item.summary, 130)}
                          </p>
                        ) : null}
                      </div>
                      {item.link ? (
                        <a
                          className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-white/20"
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
            className="w-fit rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:border-white/20"
            onClick={onNavigateToNewsArchive}
            type="button"
          >
            {landing.newsArchiveLabel || "Ver mas noticias"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ landing, contactInfo, news, institutions, socialLinks }) {
  const actions = landing.contactActions ?? [];

  return (
    <section id="contacto" className="py-24 sm:py-28 lg:py-32 bg-[#1d4ed8]">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          <div className="gobeyond-reveal">
            <SectionTag>{landing.contactTitle || "Contacto"}</SectionTag>
            <h2 className="text-[clamp(1.9rem,4.5vw,4rem)] font-black tracking-tighter leading-[0.95] text-white break-words">
              {landing.contactBody || "Ponte en contacto con GoBeyond."}
            </h2>
          </div>

          <div className="gobeyond-reveal grid gap-4">
            {contactInfo.emailValue ? (
              <a
                className="block rounded-xl border border-white/15 bg-white/10 px-5 py-5 text-white transition hover:bg-white/15"
                href={getEmailHref(contactInfo.emailValue)}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">
                  {contactInfo.emailLabel || "Email"}
                </p>
                <p className="mt-3 text-lg font-semibold break-all">{contactInfo.emailValue}</p>
              </a>
            ) : null}

            {contactInfo.phoneValue ? (
              <a
                className="block rounded-xl border border-white/15 bg-white/10 px-5 py-5 text-white transition hover:bg-white/15"
                href={getPhoneHref(contactInfo.phoneValue)}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">
                  {contactInfo.phoneLabel || "Telefono"}
                </p>
                {contactInfo.phonePrompt ? (
                  <p className="mt-1 text-sm text-blue-100/75">{contactInfo.phonePrompt}</p>
                ) : null}
                <p className="mt-2 text-lg font-semibold">{contactInfo.phoneValue}</p>
              </a>
            ) : null}

            {actions.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {actions.map((item) => {
                  const href = getContactActionHref(item, news, institutions, socialLinks);
                  const external = isExternalHref(href);
                  return (
                    <a
                      key={item}
                      className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                      href={href}
                      rel={external ? "noreferrer" : undefined}
                      target={external ? "_blank" : undefined}
                    >
                      <span>{item}</span>
                      <span>&rarr;</span>
                    </a>
                  );
                })}
              </div>
            ) : null}

            {!contactInfo.emailValue && !contactInfo.phoneValue && !actions.length ? (
              <p className="text-sm text-blue-100/60 leading-relaxed">
                Configura los datos de contacto desde el panel de administracion.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main orchestrator ───────────────────────────────────────────────────────

export function PublicExperience({
  content,
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

  const benefits = useMemo(
    () => (landing?.benefits?.length ? landing.benefits : content?.benefits ?? []),
    [landing?.benefits, content?.benefits]
  );
  const learningPath = useMemo(
    () => normalizeLearningPath(content?.learningPath ?? []).filter((i) => !isSixSigmaItem(i)),
    [content?.learningPath]
  );
  const courses = useMemo(
    () => (content?.courses ?? []).filter((i) => !isSixSigmaItem(i)),
    [content?.courses]
  );
  const programCards = useMemo(
    () =>
      Array.isArray(landing?.programCards) && landing.programCards.length
        ? landing.programCards
        : [],
    [landing?.programCards]
  );
  const liveSessions = useMemo(
    () => (content?.liveSessions ?? []).filter((i) => !isSixSigmaItem(i)),
    [content?.liveSessions]
  );
  const institutions = useMemo(() => content?.institutions ?? [], [content?.institutions]);
  const featuredInstitutions = useMemo(
    () => institutions.filter((i) => i.featured),
    [institutions]
  );
  const visibleInstitutions =
    featuredInstitutions.length > 1 ? featuredInstitutions : institutions;

  const news = useMemo(() => content?.news ?? [], [content?.news]);
  const publishedNews = useMemo(
    () =>
      noticiasPosts.length
        ? noticiasPosts.map((item) => normalizeSocialNewsItem(item))
        : getPublishedNews(news),
    [news, noticiasPosts]
  );
  const featuredNews = publishedNews[0] ?? null;
  const secondaryNews = publishedNews.slice(1, 5);
  const featuredNewsEmbed = useMemo(
    () => getEmbedDescriptor(featuredNews?.embed),
    [featuredNews?.embed]
  );
  const secondaryNewsCards = useMemo(
    () =>
      secondaryNews.map((item) => {
        const embed = getEmbedDescriptor(item.embed);
        return {
          item: { ...item, image: normalizePublicMediaUrl(item.image) },
          embed,
          externalDomain: getDomainLabel(item.link || embed.externalUrl),
        };
      }),
    [secondaryNews]
  );

  const testimonials = useMemo(
    () =>
      (content?.testimonials ?? []).filter((i) => !i.status || i.status === "approved"),
    [content?.testimonials]
  );
  const metrics = useMemo(
    () => (hero.metrics ?? []).map((i) => normalizeMetric(i)),
    [hero.metrics]
  );

  // Nav — respect admin override; fallback always includes all 8 sections
  const navLabels = landing.nav?.length ? landing.nav : DEFAULT_NAV;
  const navItems = useMemo(
    () => navLabels.map((label) => ({ label, id: slugify(label) })),
    [navLabels]
  );

  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? "inicio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [testimonialStartIndex, setTestimonialStartIndex] = useState(0);

  const rotatingTestimonials = useMemo(() => {
    if (testimonials.length <= 3) return testimonials;
    return Array.from({ length: 3 }, (_, offset) =>
      testimonials[(testimonialStartIndex + offset) % testimonials.length]
    );
  }, [testimonialStartIndex, testimonials]);

  // IntersectionObserver: reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -4% 0px" }
    );
    document.querySelectorAll(".gobeyond-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Active section tracker
  useEffect(() => {
    const sections = navItems.map((i) => document.getElementById(i.id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { threshold: [0.15, 0.35, 0.55], rootMargin: "-20% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navItems]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (testimonials.length <= 3) {
      setTestimonialStartIndex(0);
      return undefined;
    }
    const id = window.setInterval(
      () => setTestimonialStartIndex((c) => (c + 1) % testimonials.length),
      5000
    );
    return () => window.clearInterval(id);
  }, [testimonials]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/25 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#050505]/75 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <a className="flex min-w-0 shrink-0 items-center gap-3" href="#inicio">
            <img
              alt="Logo de GoBeyond"
              className="h-9 w-9 shrink-0 object-contain"
              src="/logo-icon.png"
            />
            <span className="truncate text-[11px] font-black uppercase tracking-[0.28em]">
              {shortBrand(brand.name)}
            </span>
          </a>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  activeSection === item.id ? "text-blue-400" : "text-gray-500 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => setMobileMenuOpen((v) => !v)}
              type="button"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
            <button
              className="h-11 rounded-full bg-white px-5 text-[10px] font-bold uppercase tracking-widest text-black transition hover:bg-blue-50 hover:text-blue-700"
              onClick={onRequestLogin}
            >
              Ingresar
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-white/5 bg-[#050505]/95 px-5 py-4 lg:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  className={`rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/8"
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

      {/* ── SECTIONS ── */}
      <main>
        <HeroSection
          hero={hero}
          brand={brand}
          landing={landing}
          metrics={metrics}
        />
        <AboutSection
          landing={landing}
          brand={brand}
          benefits={benefits}
        />
        <ServicesSection
          landing={landing}
          content={content}
          learningPath={learningPath}
        />
        <CoursesSection
          landing={landing}
          programCards={programCards}
          courses={courses}
          liveSessions={liveSessions}
        />
        <InstitutionsSection
          landing={landing}
          visibleInstitutions={visibleInstitutions}
        />
        <TestimonialsSection
          landing={landing}
          brand={brand}
          testimonials={testimonials}
          rotatingTestimonials={rotatingTestimonials}
          testimonialStartIndex={testimonialStartIndex}
          setTestimonialStartIndex={setTestimonialStartIndex}
        />
        <NewsLandingSection
          landing={landing}
          publishedNews={publishedNews}
          featuredNews={featuredNews}
          featuredNewsEmbed={featuredNewsEmbed}
          secondaryNewsCards={secondaryNewsCards}
          noticiasLoading={noticiasLoading}
          noticiasError={noticiasError}
          onNavigateToNewsArchive={onNavigateToNewsArchive}
        />
        <ContactSection
          landing={landing}
          contactInfo={contactInfo}
          news={news}
          institutions={institutions}
          socialLinks={socialLinks}
        />
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 safe-bottom safe-x">
        <div className="container mx-auto grid gap-8 px-5 sm:px-6 lg:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <img alt="Logo de GoBeyond" className="h-7 w-7 shrink-0 object-contain" src="/logo-icon.png" />
              <span className="text-[11px] font-black uppercase tracking-[0.28em]">
                {shortBrand(brand.name)}
              </span>
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.26em] text-gray-600">
              © {new Date().getFullYear()} · Formación de Alto Impacto · Puerto Limón, CR.
            </p>
          </div>
          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:justify-items-end">
            {legalFooterLinks.map((item) => (
              <a
                key={item.href}
                className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 transition hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
