import { useState } from "react";

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs uppercase tracking-[0.35em] ${light ? "text-[#d6bf9b]" : "text-[#8b6d55]"}`}>{eyebrow}</p>
      <h2 className={`mt-4 font-['Georgia'] text-3xl leading-tight sm:text-4xl ${light ? "text-[#f8f2e8]" : "text-[#20181f]"}`}>
        {title}
      </h2>
      {description ? <p className={`mt-4 text-base leading-7 ${light ? "text-[#e2d5c5]" : "text-[#5c4d46]"}`}>{description}</p> : null}
    </div>
  );
}

function TestimonialSubmissionForm({ createTestimonialSubmission }) {
  const [form, setForm] = useState({
    quote: "",
    author: "",
    organization: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await createTestimonialSubmission(form);
      setMessage(response.message);
      setForm({
        quote: "",
        author: "",
        organization: "",
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4 border border-[#4a3d43] bg-[#251d24] p-6" onSubmit={handleSubmit}>
      <p className="text-xs uppercase tracking-[0.25em] text-[#d6bf9b]">Comparte tu experiencia</p>
      <textarea
        className="min-h-[140px] border border-[#4a3d43] bg-transparent px-4 py-3 text-sm text-[#f8f2e8] outline-none placeholder:text-[#9d8d87]"
        value={form.quote}
        onChange={(event) => setForm({ ...form, quote: event.target.value })}
        placeholder="Escribe tu testimonio"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="border border-[#4a3d43] bg-transparent px-4 py-3 text-sm text-[#f8f2e8] outline-none placeholder:text-[#9d8d87]"
          value={form.author}
          onChange={(event) => setForm({ ...form, author: event.target.value })}
          placeholder="Tu nombre"
        />
        <input
          className="border border-[#4a3d43] bg-transparent px-4 py-3 text-sm text-[#f8f2e8] outline-none placeholder:text-[#9d8d87]"
          value={form.organization}
          onChange={(event) => setForm({ ...form, organization: event.target.value })}
          placeholder="Institucion u organizacion"
        />
      </div>
      <button className="w-fit bg-[#d6a46e] px-5 py-3 text-sm font-medium text-[#20181f]" disabled={submitting} type="submit">
        {submitting ? "Enviando..." : "Enviar testimonio"}
      </button>
      {message ? <p className="text-sm text-[#bfe0b4]">{message}</p> : null}
      {error ? <p className="text-sm text-[#f2b3a8]">{error}</p> : null}
    </form>
  );
}

export function PublicExperience({ content, createTestimonialSubmission }) {
  const { landing } = content;

  return (
    <div className="min-h-screen bg-[#f3ede3] text-[#1f1720]">
      <header className="border-b border-[#d8cdbf] bg-[#f8f3eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#8b6d55]">{content.brand.name}</p>
            <p className="mt-2 max-w-lg text-sm text-[#6d5a51]">{content.brand.description}</p>
          </div>

          <nav className="flex flex-wrap gap-3 text-sm text-[#5c4d46]">
            {landing.nav.map((item) => (
              <a
                key={item}
                className="rounded-full border border-[#d8cdbf] px-4 py-2 transition hover:border-[#b4875b] hover:text-[#20181f]"
                href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#d8cdbf] bg-[#20181f] text-[#f8f2e8]" id="inicio">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,191,155,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(182,135,91,0.22),_transparent_34%)]" />
          <div className="absolute right-[-8%] top-12 hidden h-64 w-64 rounded-full border border-[#5a4b52] lg:block" />
          <div className="absolute bottom-[-5rem] left-[40%] hidden h-40 w-40 rounded-full bg-[#d6a46e]/10 blur-3xl lg:block" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#d6bf9b]">{content.hero.eyebrow}</p>
              <h1 className="mt-5 max-w-4xl font-['Georgia'] text-5xl leading-[1.05] sm:text-6xl">{content.hero.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#e2d5c5]">{content.hero.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a className="bg-[#d6a46e] px-5 py-3 text-sm font-medium text-[#20181f]" href="#contacto">
                  Ponte en contacto
                </a>
                <a className="border border-[#584850] px-5 py-3 text-sm text-[#f8f2e8]" href="#cursos">
                  Explorar programas
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {content.hero.metrics.map((metric) => (
                <div key={metric.label} className="border border-[#3c3136] bg-[#2a2028]/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#c8b59a]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#d8cab8]">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-[linear-gradient(180deg,#f8f3eb_0%,#f4ede3_100%)]" id="sobre-nosotros">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeading eyebrow={landing.aboutTitle} title={content.brand.tagline} description={landing.aboutBody} />

            <div className="space-y-6 text-[#5c4d46]">
              <p className="text-lg leading-8">{landing.aboutBodyTwo}</p>
              <p className="text-lg leading-8">
                Nuestro objetivo es claro: abrir oportunidades reales de formacion especializada, reducir brechas en el acceso a certificaciones internacionales y contribuir al fortalecimiento de la empleabilidad y competitividad de la juventud.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {content.benefits.map((item) => (
                  <div key={item} className="border border-[#d8cdbf] bg-white/70 p-4 text-sm leading-6">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-white" id="servicios">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeading
              eyebrow={landing.servicesTitle}
              title="Capacitacion alineada con las necesidades reales del mercado."
              description={landing.relevanceBody}
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {content.learningPath.map((item) => (
                <article key={item.id} className="border border-[#d8cdbf] bg-[#fbf8f2] p-6 transition hover:-translate-y-1 hover:border-[#b4875b] hover:shadow-[0_20px_45px_rgba(128,94,62,0.12)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8b6d55]">{item.type}</p>
                  <h3 className="mt-3 font-['Georgia'] text-2xl">{item.title}</h3>
                  <p className="mt-4 text-[#5c4d46]">{item.status}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-[#fdf8f1]" id="cursos">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeading
              eyebrow={landing.coursesTitle}
              title="Programas creados para preparar talento con impacto real."
              description="El equipo administrativo puede construir y actualizar esta oferta directamente desde la plataforma, con enfoque academico, profesional y social."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {(content.courses ?? []).map((course) => (
                <article key={course.id} className="grid gap-4 border border-[#d8cdbf] bg-white p-7 shadow-[0_18px_40px_rgba(122,73,58,0.08)]">
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-[#8b6d55]">
                    <span>{course.format}</span>
                    <span>•</span>
                    <span>{course.duration}</span>
                  </div>
                  <h3 className="font-['Georgia'] text-3xl leading-tight">{course.title}</h3>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#8b6d55]">{course.audience}</p>
                  <p className="text-[#5c4d46]">{course.description}</p>
                  <div className="border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                    <strong className="text-[#20181f]">Resultados esperados:</strong> {course.outcomes}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-[#f3ede3]" id="impacto">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1fr]">
            <div className="border border-[#cfbfaa] bg-[#20181f] p-8 text-[#f8f2e8]">
              <SectionHeading eyebrow="Nuestro impacto" title="Compromiso social y educativo con oportunidades concretas." description="Go Beyond impulsa programas becados para instituciones publicas y planes accesibles para organizaciones privadas con una vision clara de retorno social y profesional." light />

              <div className="mt-8 space-y-5">
                {content.accessTimeline.map((step) => (
                  <div key={step.id} className="border-l-2 border-[#d6a46e] pl-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#d6bf9b]">{step.label}</p>
                    <h3 className="mt-2 text-xl font-medium">{step.title}</h3>
                    <p className="mt-2 text-[#e2d5c5]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {content.communityStats.map((item) => (
                <div key={item.id} className="border border-[#d8cdbf] bg-white/75 p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{item.label}</p>
                  <h3 className="mt-3 font-['Georgia'] text-3xl leading-tight">{item.value}</h3>
                  <p className="mt-3 text-[#5c4d46]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-[#fbf7f0]" id="testimonios">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHeading eyebrow={landing.trustTitle} title="Instituciones y comunidades que creen en este cambio." description="Go Beyond busca fortalecer el prestigio institucional y la preparacion del estudiantado con una oferta formativa conectada al futuro laboral." />

              <div className="mt-8 flex flex-wrap gap-3">
                {landing.trustItems.map((item) => (
                  <span key={item} className="border border-[#cfbfaa] bg-white px-4 py-3 text-sm text-[#5c4d46] shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8b6d55]">{landing.testimonialTitle}</p>
              {(content.testimonials ?? []).map((item, index) => (
                <article key={item.id} className={`border border-[#cfbfaa] p-8 ${index === 0 ? "bg-white shadow-[0_24px_60px_rgba(94,71,49,0.14)]" : "bg-[#fffaf4]"}`}>
                  <blockquote className="font-['Georgia'] text-2xl leading-10 text-[#20181f]">“{item.quote}”</blockquote>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[#8b6d55]">{item.author}</p>
                      <p className="mt-1 text-sm text-[#5c4d46]">{item.organization}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border border-[#d9c2a3] bg-[#f6ebdc]" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8cdbf] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <SectionHeading eyebrow={landing.relevanceTitle} title={content.subscription.label} description={content.subscription.description} />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {content.liveSessions.map((item) => (
                <div key={item.id} className="border border-[#d8cdbf] bg-[#fbf8f2] p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{item.date}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#5c4d46]">{item.format}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#20181f] text-[#f8f2e8]" id="contacto">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_0.95fr]">
            <div className="space-y-8">
              <SectionHeading eyebrow={landing.contactTitle} title="Ponte en contacto y ayudanos a ampliar oportunidades." description={landing.contactBody} light />

              <div className="grid gap-4">
                {landing.contactActions.map((item) => (
                  <a key={item} className="flex items-center justify-between border border-[#4a3d43] px-5 py-4 text-sm text-[#f8f2e8] transition hover:border-[#d6a46e]" href="#inicio">
                    <span>{item}</span>
                    <span className="text-[#d6bf9b]">Explorar</span>
                  </a>
                ))}
              </div>
            </div>

            <TestimonialSubmissionForm createTestimonialSubmission={createTestimonialSubmission} />
          </div>
        </section>
      </main>
    </div>
  );
}
