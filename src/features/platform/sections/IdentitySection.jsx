import {
  ActionButton,
  EmptyState,
  FilterInput,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
} from "../components/admin/AdminUI";

export function IdentitySection({
  content,
  deleteCollectionItem,
  filteredInstitutions,
  filteredLearning,
  filteredMediaLibrary,
  filteredSessions,
  institutions,
  mediaLibrary,
  openModal,
  startCreateInstitution,
  startCreateLearning,
  startCreateSession,
  startEditInstitution,
  startEditLearning,
  startEditSession,
  updateViewFilter,
  viewFilters,
}) {
  return (
    <div className="grid gap-6">
      <SectionCard
        title="Identidad y narrativa"
        description="Todo el contenido institucional vive aqui, pero ya no te obliga a convivir con formularios abiertos todo el tiempo."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <RowCard eyebrow="Marca" title={content.brand.name} meta={content.brand.tagline} body={content.brand.description}>
            <ActionButton onClick={() => openModal("brand")} type="button">
              Editar marca
            </ActionButton>
          </RowCard>
          <RowCard eyebrow="Hero" title={content.hero.title} meta={content.hero.eyebrow} body={content.hero.description}>
            <ActionButton onClick={() => openModal("hero")} type="button">
              Editar hero
            </ActionButton>
          </RowCard>
          <RowCard
            eyebrow="Narrativa"
            title={content.landing.aboutTitle}
            meta="Historia institucional, relevancia laboral y bloque de contacto"
            body={content.landing.contactBody}
          >
            <ActionButton onClick={() => openModal("landing")} type="button">
              Editar narrativa
            </ActionButton>
          </RowCard>
          <RowCard
            eyebrow="Redes sociales"
            title="Facebook, LinkedIn e Instagram"
            meta="Links publicos visibles en el landing"
            body={[
              `Facebook: ${content.landing?.socialLinks?.facebook || "Sin enlace configurado"}`,
              `LinkedIn: ${content.landing?.socialLinks?.linkedin || "Sin enlace configurado"}`,
              `Instagram: ${content.landing?.socialLinks?.instagram || "Sin enlace configurado"}`,
            ].join("\n")}
          >
            <ActionButton onClick={() => openModal("landing")} type="button">
              Editar redes
            </ActionButton>
          </RowCard>
        </div>
      </SectionCard>

      <SectionCard
        title="Instituciones aliadas"
        description="Gestiona logos, imagenes de representacion y enlaces de las instituciones desde una biblioteca compacta. En el landing solo se muestran las destacadas para no desacomodar la pagina."
      >
        <SectionToolbar
          action={
            <ActionButton onClick={startCreateInstitution} type="button">
              Agregar institucion
            </ActionButton>
          }
          helper={`${institutions.filter((item) => item.featured).length} destacadas · ${institutions.length} en total. Si se integran mas instituciones, se siguen guardando aqui pero el landing conserva solo una seleccion visual.`}
        >
          <FilterInput
            onChange={(event) => updateViewFilter("institutions", event.target.value)}
            placeholder="Filtrar instituciones por nombre, enlace o estado"
            value={viewFilters.institutions}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredInstitutions.length ? (
              filteredInstitutions.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[1.15rem] border border-[#dfe6ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                >
                  <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="aspect-[4/3] bg-[#edf2f7]">
                      {item.image ? (
                        <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#708198]">Sin imagen</div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">
                        {item.featured ? "Visible en landing" : "Archivada de landing"}
                      </p>
                      <h4 className="mt-2 text-xl font-medium text-[#172033]">{item.name}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-[#617085]">{item.link || "Sin enlace de referencia"}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <SecondaryButton onClick={() => startEditInstitution(item)} type="button">
                          Editar
                        </SecondaryButton>
                        <SecondaryButton onClick={() => deleteCollectionItem("institutions", item.id)} type="button">
                          Eliminar
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No hay instituciones que coincidan"
                body="Ajusta el filtro o agrega una nueva con imagen y enlace para que el landing las muestre de forma ordenada."
              />
            )}
          </div>
        </ScrollArea>
      </SectionCard>

      <SectionCard
        title="Biblioteca de medios"
        description="Cada archivo subido queda registrado aqui para reutilizarlo. Si el mismo archivo se intenta subir otra vez, el sistema devuelve el asset existente y evita duplicados."
      >
        <SectionToolbar helper={`${mediaLibrary.length} assets registrados en la biblioteca compartida.`}>
          <FilterInput
            onChange={(event) => updateViewFilter("media", event.target.value)}
            placeholder="Filtrar biblioteca por nombre, tipo, hash o proposito"
            value={viewFilters.media}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMediaLibrary.length ? (
              filteredMediaLibrary.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[1rem] border border-[#dfe6ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
                >
                  <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-0">
                    {String(item.contentType ?? "").startsWith("image/") ? (
                      <div className="h-20 w-20 bg-[#edf2f7]">
                        <img alt={item.fileName} className="h-full w-full object-cover" src={item.url} />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center bg-[#e8eef6] text-[10px] uppercase tracking-[0.2em] text-[#708198]">
                        File
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#748197]">{item.purpose}</p>
                      <h4 className="mt-1 truncate text-sm font-medium text-[#172033]">{item.fileName}</h4>
                      <p className="mt-2 text-xs text-[#617085]">{Math.round(Number(item.size ?? 0) / 1024)} KB</p>
                      <p className="mt-1 truncate text-[11px] text-[#748197]">{item.hash?.slice(0, 16)}...</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No hay archivos que coincidan"
                body="Cuando subas imagenes o adjuntos, quedaran registrados aqui para reutilizarlos sin duplicar uploads."
              />
            )}
          </div>
        </ScrollArea>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sesiones en vivo" description="Crea o ajusta encuentros sin exponer un formulario perpetuo en pantalla.">
          <SectionToolbar
            action={
              <ActionButton onClick={startCreateSession} type="button">
                Crear sesion
              </ActionButton>
            }
          >
            <FilterInput
              onChange={(event) => updateViewFilter("sessions", event.target.value)}
              placeholder="Filtrar sesiones por titulo, fecha o formato"
              value={viewFilters.sessions}
            />
          </SectionToolbar>
          <ScrollArea>
            <div className="grid gap-4">
              {filteredSessions.length ? (
                filteredSessions.map((item) => (
                  <RowCard key={item.id} eyebrow={item.format} title={item.title} meta={item.date}>
                    <SecondaryButton onClick={() => startEditSession(item)} type="button">
                      Editar
                    </SecondaryButton>
                    <SecondaryButton onClick={() => deleteCollectionItem("liveSessions", item.id)} type="button">
                      Eliminar
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : (
                <EmptyState
                  title="No hay sesiones que coincidan"
                  body="Crea una nueva o ajusta el filtro para ver otras sesiones."
                />
              )}
            </div>
          </ScrollArea>
        </SectionCard>

        <SectionCard title="Ruta de aprendizaje" description="La ruta se administra como piezas ordenadas, no como campos sueltos.">
          <SectionToolbar
            action={
              <ActionButton onClick={startCreateLearning} type="button">
                Crear modulo
              </ActionButton>
            }
          >
            <FilterInput
              onChange={(event) => updateViewFilter("learning", event.target.value)}
              placeholder="Filtrar modulos por titulo, tipo o enfoque"
              value={viewFilters.learning}
            />
          </SectionToolbar>
          <ScrollArea>
            <div className="grid gap-4">
              {filteredLearning.length ? (
                filteredLearning.map((item) => (
                  <RowCard key={item.id} eyebrow={item.type} title={item.title} body={item.status}>
                    <SecondaryButton onClick={() => startEditLearning(item)} type="button">
                      Editar
                    </SecondaryButton>
                    <SecondaryButton onClick={() => deleteCollectionItem("learningPath", item.id)} type="button">
                      Eliminar
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : (
                <EmptyState title="No hay modulos que coincidan" body="Crea uno nuevo o ajusta el filtro." />
              )}
            </div>
          </ScrollArea>
        </SectionCard>
      </div>
    </div>
  );
}
