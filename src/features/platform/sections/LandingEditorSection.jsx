import { useEffect, useMemo, useRef, useState } from "react";

// ── Atomic components matching PublicExperience visuals ──────────────────────

const SectionTag = ({ children }) => (
  <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block">
    {children}
  </span>
);

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-blue-500/30 hover:bg-white/[0.04] ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, className = "" }) => (
  <span
    className={`px-3 py-1 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest rounded-full ${className}`}
  >
    {children}
  </span>
);

function ProgramList({ title, items }) {
  const allItems = Array.isArray(items) ? items : [];
  const hasContent = allItems.some((s) => String(s ?? "").trim());
  if (!hasContent) return null;
  return (
    <div className="mt-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">{title}</p>
      <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-gray-300">
        {allItems.map((item, i) => (
          String(item ?? "").trim() ? (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{item}</span>
            </li>
          ) : (
            <li key={i} className="h-2" />
          )
        ))}
      </ul>
    </div>
  );
}

// ── Editor primitives ────────────────────────────────────────────────────────

function EditableField({ value, onChange, as: Tag = "span", className = "", placeholder = "Editar...", multiline = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value ?? "";
    }
  }, [value]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onChange(e.currentTarget.textContent.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline) e.preventDefault();
      }}
      className={`outline-none cursor-text hover:ring-1 hover:ring-white/25 focus:ring-2 focus:ring-blue-400/50 focus:bg-white/[0.06] rounded-sm transition-all [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:opacity-30 [&:empty]:before:pointer-events-none ${className}`}
    />
  );
}

function DarkInput({ value, onChange, placeholder = "" }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LandingEditorSection({
  landingForm,
  heroForm,
  brandForm,
  content,
  setLandingForm,
  setHeroForm,
  setBrandForm,
  onSaveAll,
  onOpenAdvancedForm,
}) {
  const [saving, setSaving] = useState(false);

  const programCards = useMemo(
    () => (Array.isArray(landingForm?.programCards) ? landingForm.programCards : []),
    [landingForm?.programCards]
  );

  const benefitLines = useMemo(
    () =>
      String(landingForm?.benefits ?? "")
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [landingForm?.benefits]
  );

  const testimonials = useMemo(
    () => (content?.testimonials ?? []).filter((t) => !t.status || t.status === "approved"),
    [content?.testimonials]
  );

  const institutions = content?.institutions ?? [];
  const contactInfo = landingForm?.contactInfo ?? {};
  const socialLinks = landingForm?.socialLinks ?? {};

  // ── Setters ──
  const setLanding = (key, val) => setLandingForm((prev) => ({ ...prev, [key]: val }));
  const setHero = (key, val) => setHeroForm((prev) => ({ ...prev, [key]: val }));
  const setBrand = (key, val) => setBrandForm((prev) => ({ ...prev, [key]: val }));

  const updateCard = (index, key, val) =>
    setLandingForm((prev) => ({
      ...prev,
      programCards: (prev.programCards ?? []).map((card, i) =>
        i === index ? { ...card, [key]: val } : card
      ),
    }));

  const updateBenefit = (i, val) => {
    const lines = [...benefitLines];
    lines[i] = val;
    setLanding("benefits", lines.join("\n\n"));
  };
  const addBenefit = () =>
    setLanding("benefits", (landingForm?.benefits ?? "") + "\n\nNuevo beneficio");
  const removeBenefit = (i) =>
    setLanding("benefits", benefitLines.filter((_, idx) => idx !== i).join("\n\n"));

  const setContactInfo = (key, val) =>
    setLanding("contactInfo", { ...contactInfo, [key]: val });
  const setSocialLink = (key, val) =>
    setLanding("socialLinks", { ...socialLinks, [key]: val });

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveAll();
    } finally {
      setSaving(false);
    }
  }

  const navLabels = String(landingForm?.nav ?? "Inicio, Sobre nosotros, Servicios, Impacto, Testimonios, Contacto")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans overflow-x-hidden relative">

      {/* ── STICKY SAVE BAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-[200] flex items-center justify-between gap-3 px-5 py-3 bg-[#111827]/95 backdrop-blur border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400 hidden sm:inline">
          ✎ Editor visual — Landing page
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onOpenAdvancedForm}
            className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:border-white/30 hover:text-white"
            type="button"
          >
            Formulario avanzado
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-blue-600 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {saving ? "Guardando..." : "Guardar cambios ▶"}
          </button>
        </div>
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img alt="Logo" className="h-9 w-9 object-contain" src="/logo-icon.png" />
            <EditableField
              value={brandForm?.name ?? ""}
              onChange={(v) => setBrand("name", v)}
              as="span"
              className="text-[11px] font-black uppercase tracking-[0.3em]"
              placeholder="Nombre de la marca"
            />
          </div>
          <nav className="hidden md:flex gap-6">
            {navLabels.map((label) => (
              <span key={label} className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
                {label}
              </span>
            ))}
          </nav>
          <span className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black">
            Ingresar
          </span>
        </div>

        {/* Nav + social editor panel */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-3">
          <details className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <summary className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.24em] text-blue-400 cursor-pointer hover:bg-white/[0.03] select-none">
              ✎ Editar etiquetas de navegación y redes sociales
            </summary>
            <div className="px-4 pb-4 pt-2 grid gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Etiquetas del menú (separadas por coma)
                </p>
                <DarkInput
                  value={landingForm?.nav ?? ""}
                  onChange={(v) => setLanding("nav", v)}
                  placeholder="Inicio, Sobre nosotros, Servicios, ..."
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Facebook</p>
                  <DarkInput
                    value={socialLinks.facebook ?? ""}
                    onChange={(v) => setSocialLink("facebook", v)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">LinkedIn</p>
                  <DarkInput
                    value={socialLinks.linkedin ?? ""}
                    onChange={(v) => setSocialLink("linkedin", v)}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Instagram</p>
                  <DarkInput
                    value={socialLinks.instagram ?? ""}
                    onChange={(v) => setSocialLink("instagram", v)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative flex min-h-screen items-center pb-16 pt-28 sm:pb-20 sm:pt-32">
          <div className="container mx-auto grid items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <EditableField
                value={heroForm?.eyebrow ?? ""}
                onChange={(v) => setHero("eyebrow", v)}
                as="span"
                className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
                placeholder="Eyebrow del Hero"
              />
              <h1 className="max-w-4xl text-[3rem] sm:text-[3.6rem] md:text-[5rem] lg:text-[6.2rem] font-[900] leading-[0.9] tracking-[-0.06em]">
                <EditableField
                  value={heroForm?.title ?? ""}
                  onChange={(v) => setHero("title", v)}
                  as="span"
                  placeholder="Título principal del Hero"
                />
              </h1>
              <EditableField
                value={heroForm?.description ?? ""}
                onChange={(v) => setHero("description", v)}
                as="p"
                multiline
                className="mt-8 max-w-xl text-sm sm:text-base md:text-lg text-gray-400 font-light leading-relaxed"
                placeholder="Descripción del Hero..."
              />
              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <span className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl text-sm text-center min-w-0">
                  <EditableField
                    value={landingForm?.heroPrimaryCtaLabel ?? ""}
                    onChange={(v) => setLanding("heroPrimaryCtaLabel", v)}
                    as="span"
                    placeholder="Botón principal"
                  />
                </span>
                <span className="px-8 py-4 bg-transparent text-white border border-white/10 font-bold rounded-xl text-sm text-center min-w-0">
                  <EditableField
                    value={landingForm?.heroSecondaryCtaLabel ?? ""}
                    onChange={(v) => setLanding("heroSecondaryCtaLabel", v)}
                    as="span"
                    placeholder="Botón secundario"
                  />
                </span>
              </div>
            </div>
            <div className="relative flex h-[280px] items-center justify-center sm:h-[360px] md:h-[500px] lg:h-[600px]">
              <div className="w-full h-full rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-700 text-center px-6">
                  Panel visual del Hero<br />(se muestra en el landing público)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOBRE NOSOTROS ──────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-8">
          <div className="grid gap-10 items-start lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <EditableField
                value={landingForm?.aboutTitle ?? ""}
                onChange={(v) => setLanding("aboutTitle", v)}
                as="span"
                className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
                placeholder="Etiqueta sección"
              />
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
                <EditableField
                  value={brandForm?.name ?? ""}
                  onChange={(v) => setBrand("name", v)}
                  as="span"
                  placeholder="Nombre de la institución"
                />
              </h2>
              <EditableField
                value={landingForm?.aboutBodyTwo ?? ""}
                onChange={(v) => setLanding("aboutBodyTwo", v)}
                as="p"
                multiline
                className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light"
                placeholder="Párrafo Sobre nosotros..."
              />
            </div>

            <GlassCard>
              <div className="grid gap-4 md:grid-cols-2">
                {benefitLines.map((item, i) => (
                  <div key={i} className="group relative rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5">
                    <EditableField
                      value={item}
                      onChange={(v) => updateBenefit(i, v)}
                      as="p"
                      multiline
                      className="text-sm leading-relaxed text-gray-400 w-full"
                      placeholder="Beneficio..."
                    />
                    <button
                      onClick={() => removeBenefit(i)}
                      className="absolute right-3 top-3 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-gray-500 text-xs hover:bg-red-900/30 hover:text-red-400 transition-all"
                      type="button"
                      aria-label="Eliminar beneficio"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBenefit}
                  className="rounded-[1.5rem] border border-dashed border-white/15 bg-transparent p-5 text-[10px] font-bold uppercase tracking-widest text-gray-600 transition hover:border-blue-500/30 hover:text-blue-400"
                  type="button"
                >
                  + Agregar beneficio
                </button>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ── SERVICIOS ───────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 lg:py-32 container mx-auto px-5 sm:px-8">
          <div className="max-w-4xl">
            <EditableField
              value={landingForm?.servicesTitle ?? ""}
              onChange={(v) => setLanding("servicesTitle", v)}
              as="span"
              className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
              placeholder="Etiqueta servicios"
            />
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
              <EditableField
                value={landingForm?.subscriptionLabel ?? ""}
                onChange={(v) => setLanding("subscriptionLabel", v)}
                as="span"
                placeholder="Encabezado grande de servicios"
              />
            </h2>
            <EditableField
              value={landingForm?.relevanceBody ?? ""}
              onChange={(v) => setLanding("relevanceBody", v)}
              as="p"
              multiline
              className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light"
              placeholder="Descripción de la relevancia laboral..."
            />
          </div>
          <div className="mt-14 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-600">
              Las rutas de aprendizaje se gestionan en Marca e identidad → Rutas
            </p>
          </div>
        </section>

        {/* ── PROGRAMAS Y CURSOS ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 lg:py-32 bg-[#080808]">
          <div className="container mx-auto px-5 sm:px-8">
            <div className="text-center mb-20">
              <EditableField
                value={landingForm?.coursesTitle ?? ""}
                onChange={(v) => setLanding("coursesTitle", v)}
                as="span"
                className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
                placeholder="Etiqueta sección programas"
              />
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
                <EditableField
                  value={landingForm?.coursesHeading ?? ""}
                  onChange={(v) => setLanding("coursesHeading", v)}
                  as="span"
                  placeholder="Encabezado de programas"
                />
              </h2>
            </div>

            {programCards.length ? (
              <div className="grid gap-6 xl:grid-cols-3">
                {programCards.map((program, index) => {
                  const initials = String(program.title ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
                  return (
                    <GlassCard
                      key={program.id || index}
                      className={`flex h-full flex-col justify-between overflow-hidden ${index === 0 ? "border-blue-500/20 bg-blue-600/[0.02]" : ""}`}
                    >
                      <div>
                        {/* Cover image */}
                        <div className="mb-7 overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#0b0f17]">
                          {program.image ? (
                            <img alt={program.title} className="h-52 w-full object-cover" src={program.image} />
                          ) : (
                            <div className="relative flex h-52 w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),rgba(12,18,32,0.95)_58%)] p-6">
                              <div className="absolute right-5 top-5 text-5xl font-black tracking-tighter text-white/10">{initials || "GB"}</div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">Agregar imagen desde formulario avanzado</p>
                            </div>
                          )}
                        </div>

                        <Badge>
                          <EditableField value={program.eyebrow ?? ""} onChange={(v) => updateCard(index, "eyebrow", v)} as="span" placeholder="Badge" />
                        </Badge>
                        <h3 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white">
                          <EditableField value={program.title ?? ""} onChange={(v) => updateCard(index, "title", v)} as="span" placeholder="Título del curso" />
                        </h3>
                        <EditableField
                          value={program.description ?? ""}
                          onChange={(v) => updateCard(index, "description", v)}
                          as="p"
                          multiline
                          className="mt-5 text-sm leading-relaxed text-gray-400"
                          placeholder="Descripción (texto gris)..."
                        />
                        {(program.relevance || true) ? (
                          <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">¿Por qué es relevante?</p>
                            <EditableField
                              value={program.relevance ?? ""}
                              onChange={(v) => updateCard(index, "relevance", v)}
                              as="p"
                              multiline
                              className="mt-3 text-sm leading-relaxed text-gray-200"
                              placeholder="Texto de relevancia..."
                            />
                          </div>
                        ) : null}
                        <ProgramList items={program.outcomes} title="Resultados" />
                        <ProgramList items={program.availablePrograms} title="Programas disponibles" />
                        <ProgramList items={program.includes} title="Incluye" />
                        <ProgramList items={program.benefits} title="Beneficios adicionales" />
                        {program.certificationNote ? (
                          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400">{program.certificationNote}</p>
                        ) : null}
                      </div>
                      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-gray-600">
                          Imagen, resultados, URL y CTA → formulario avanzado
                        </p>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-600">
                  Agrega tarjetas de programa desde el Formulario avanzado
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── TESTIMONIOS ─────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 lg:py-32 bg-[#080808]">
          <div className="container mx-auto px-5 sm:px-8">
            <div className="max-w-4xl">
              <EditableField
                value={landingForm?.trustTitle ?? ""}
                onChange={(v) => setLanding("trustTitle", v)}
                as="span"
                className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
                placeholder="Etiqueta testimonios"
              />
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 sm:mb-8">
                <EditableField
                  value={landingForm?.testimonialTitle ?? ""}
                  onChange={(v) => setLanding("testimonialTitle", v)}
                  as="span"
                  placeholder="Título de testimonios"
                />
              </h2>
              <EditableField
                value={landingForm?.trustBody ?? ""}
                onChange={(v) => setLanding("trustBody", v)}
                as="p"
                multiline
                className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed font-light"
                placeholder="Párrafo introductorio de testimonios..."
              />
            </div>

            {testimonials.length ? (
              <div className="mt-14 grid gap-4 xl:grid-cols-3">
                {testimonials.slice(0, 3).map((item, index) => {
                  const initials = String(item.author ?? "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");
                  return (
                    <article
                      key={item.id || index}
                      className={`rounded-[1.9rem] border p-7 ${
                        index === 0
                          ? "border-l-4 border-l-blue-500 bg-white/[0.05] shadow-2xl"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <span className="mb-[-1.5rem] block text-[5rem] leading-none text-blue-900 select-none">"</span>
                      <blockquote className="text-[1.35rem] leading-relaxed text-white sm:text-[1.5rem]">
                        {item.quote}
                      </blockquote>
                      <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/10 text-sm font-semibold text-blue-200">
                          {initials}
                        </div>
                        <p className="min-w-0 text-xs uppercase tracking-[0.2em] text-white">
                          {item.author}
                          {item.organization ? (
                            <span className="mx-1.5 text-blue-200/50">·</span>
                          ) : null}
                          <span className="text-gray-400">{item.organization}</span>
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-14 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-600">
                  Sin testimonios aprobados · gestionados en Marca e identidad
                </p>
              </div>
            )}

            {/* INSTITUCIONES */}
            <div className="mt-14 sm:mt-16 lg:mt-20">
              <div className="mb-8 max-w-4xl">
                <EditableField
                  value={landingForm?.institutionsCarouselTitle ?? ""}
                  onChange={(v) => setLanding("institutionsCarouselTitle", v)}
                  as="span"
                  className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-500 mb-6 block"
                  placeholder="Etiqueta instituciones"
                />
                <EditableField
                  value={landingForm?.institutionsCarouselBody ?? ""}
                  onChange={(v) => setLanding("institutionsCarouselBody", v)}
                  as="p"
                  multiline
                  className="text-base leading-relaxed text-gray-500 sm:text-lg"
                  placeholder="Descripción de instituciones aliadas..."
                />
              </div>
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">
                  {institutions.length
                    ? `${institutions.length} institución(es) · gestionadas en Marca e identidad`
                    : "Sin instituciones publicadas · gestionadas en Marca e identidad"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACTO ────────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 lg:py-32 bg-[#1d4ed8]">
          <div className="container mx-auto px-5 sm:px-8">
            <div className="grid gap-12 items-start lg:grid-cols-[0.92fr_1.08fr]">
              <div>
                <EditableField
                  value={landingForm?.contactTitle ?? ""}
                  onChange={(v) => setLanding("contactTitle", v)}
                  as="span"
                  className="text-[11px] font-bold uppercase tracking-[0.5em] text-blue-200 mb-6 block"
                  placeholder="Etiqueta contacto"
                />
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white">
                  <EditableField
                    value={landingForm?.contactBody ?? ""}
                    onChange={(v) => setLanding("contactBody", v)}
                    as="span"
                    placeholder="Encabezado de contacto"
                  />
                </h2>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/15 bg-white/10 px-5 py-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100">
                      {contactInfo.emailLabel || "Email"}
                    </p>
                    <p className="mt-4 text-lg font-semibold leading-snug">
                      <EditableField
                        value={contactInfo.emailValue ?? ""}
                        onChange={(v) => setContactInfo("emailValue", v)}
                        as="span"
                        className="text-white"
                        placeholder="correo@gobeyond.cr"
                      />
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/15 bg-white/10 px-5 py-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100">
                      {contactInfo.phoneLabel || "Teléfono"}
                    </p>
                    <p className="mt-4 text-lg font-semibold leading-snug">
                      <EditableField
                        value={contactInfo.phoneValue ?? ""}
                        onChange={(v) => setContactInfo("phoneValue", v)}
                        as="span"
                        className="text-white"
                        placeholder="+506 0000-0000"
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img alt="Logo" className="h-7 w-7 object-contain" src="/logo-icon.png" />
            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">
              {brandForm?.name || "GoBeyond"}
            </span>
          </div>
          <p className="mt-4 text-[11px] text-gray-600">
            © {new Date().getFullYear()} {brandForm?.name || "GoBeyond Academy"} · Formación de Alto Impacto · Puerto Limón, CR.
          </p>
        </div>
      </footer>

    </div>
  );
}
