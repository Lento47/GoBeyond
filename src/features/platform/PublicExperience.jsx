const sections = ["Inicio", "Aprendizaje", "Acceso", "Comunidad"];

export function PublicExperience({ active, setActive, content }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[#d8cdbf] bg-[#1e1820] px-6 py-8 text-[#f7f1e8] lg:border-b-0 lg:border-r">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c6b79f]">{content.brand.name}</p>
          <h1 className="mt-4 font-['Georgia'] text-3xl leading-none">{content.brand.tagline}</h1>
          <p className="mt-4 text-sm text-[#d8cdbf]">{content.brand.description}</p>
        </div>

        <nav className="space-y-2 text-sm">
          {sections.map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`w-full rounded-full px-4 py-3 text-left transition ${
                active === item ? "bg-[#d7a86e] text-[#1e1820]" : "text-[#e9dece] hover:bg-[#2a222c]"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-12 border-t border-[#3a313c] pt-6 text-sm text-[#d8cdbf]">
          <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-[#a99679]">Modelo actual</p>
          <p>Acceso inicial por 45 dias.</p>
          <p>Continuidad opcional por {content.subscription.price} mensuales.</p>
        </div>
      </aside>

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(215,168,110,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(122,73,58,0.18),_transparent_26%)]" />

        <div className="relative px-6 py-8 sm:px-10 lg:px-14">
          <header className="mb-10 flex flex-col gap-6 border-b border-[#d8cdbf] pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#8b6d55]">{content.hero.eyebrow}</p>
              <h2 className="font-['Georgia'] text-4xl leading-tight sm:text-5xl">{content.hero.title}</h2>
              <p className="mt-4 max-w-2xl text-base text-[#5c4d46] sm:text-lg">{content.hero.description}</p>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
              {content.hero.metrics.map((metric) => (
                <div key={metric.label} className="border border-[#cfbfaa] bg-[#fbf8f2] p-4">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b6d55]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-[#6d5a51]">{metric.description}</p>
                </div>
              ))}
            </div>
          </header>

          {active === "Inicio" && (
            <section className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="border border-[#cbbba6] bg-[#20181f] p-8 text-[#f6efe4]">
                <p className="text-xs uppercase tracking-[0.35em] text-[#d7a86e]">Experiencia principal</p>
                <h3 className="mt-5 font-['Georgia'] text-3xl leading-tight">
                  Una experiencia pequena, clara y acompanada para que el estudiante no se pierda.
                </h3>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {content.benefits.map((item) => (
                    <div key={item} className="border border-[#3a313c] px-4 py-4 text-sm text-[#f2e8da]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {content.liveSessions.map((session) => (
                  <div key={session.id} className="border border-[#cfbfaa] bg-[#fbf8f2] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{session.format}</p>
                        <h3 className="mt-2 text-xl font-medium">{session.title}</h3>
                      </div>
                      <span className="rounded-full bg-[#efe1ce] px-3 py-1 text-xs text-[#7a493a]">{session.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "Aprendizaje" && (
            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border border-[#cfbfaa] bg-[#fbf8f2] p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b6d55]">Ruta del estudiante</p>
                <h3 className="mt-4 font-['Georgia'] text-3xl leading-tight">
                  Cada parte del programa cumple una funcion concreta.
                </h3>
                <p className="mt-4 max-w-lg text-[#5c4d46]">
                  El valor no esta solo en acumular cursos, sino en mezclar sesiones en vivo, seguimiento y una
                  biblioteca util que el estudiante pueda consultar durante su acceso.
                </p>
              </div>

              <div className="divide-y divide-[#d8cdbf] border border-[#cfbfaa] bg-[#fffdf9]">
                {content.learningPath.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{item.type}</p>
                      <h3 className="mt-2 text-lg font-medium">{item.title}</h3>
                    </div>
                    <span className="rounded-full border border-[#d4c2ac] px-3 py-1 text-sm text-[#6d5a51]">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "Acceso" && (
            <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="border border-[#cfbfaa] bg-[#fffdf9] p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-[#8b6d55]">Acceso y continuidad</p>
                <h3 className="mt-4 font-['Georgia'] text-3xl leading-tight">
                  El modelo de 45 dias le da claridad al estudiante y sostenibilidad al proyecto.
                </h3>

                <div className="mt-8 space-y-5">
                  {content.accessTimeline.map((step) => (
                    <div key={step.id} className="grid gap-3 border-l-2 border-[#d7a86e] pl-5">
                      <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{step.label}</p>
                      <h4 className="text-xl font-medium">{step.title}</h4>
                      <p className="max-w-2xl text-[#5c4d46]">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#c8b29a] bg-[#231b22] p-8 text-[#f7f0e5]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#d7a86e]">Suscripcion futura</p>
                <h3 className="mt-4 font-['Georgia'] text-3xl">Acceso extendido por un monto simbolico.</h3>
                <div className="mt-8 border border-[#3a313c] px-5 py-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-[#bfa78c]">{content.subscription.label}</p>
                  <p className="mt-3 text-5xl font-semibold">{content.subscription.price}</p>
                  <p className="mt-2 text-[#ddcfbf]">{content.subscription.description}</p>
                </div>
              </div>
            </section>
          )}

          {active === "Comunidad" && (
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {content.communityStats.map((item) => (
                <div key={item.id} className="border border-[#cfbfaa] bg-[#fbf8f2] p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{item.label}</p>
                  <h3 className="mt-3 text-3xl font-semibold">{item.value}</h3>
                  <p className="mt-3 text-[#5c4d46]">{item.description}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
