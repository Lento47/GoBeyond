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

export function CatalogSection({
  courseTemplates,
  filteredCohorts,
  deleteCollectionItem,
  filteredCourses,
  startCreateCohort,
  startCreateCourse,
  startEditCohort,
  startEditCourse,
  updateViewFilter,
  viewFilters,
}) {
  return (
    <div className="grid gap-6">
      <SectionCard
        title="Catalogo de cursos"
        description={`Ahora el catalogo se gestiona como una lista limpia. Cada accion abre un editor encima con preview antes de guardar. Plantillas activas: ${courseTemplates.length}.`}
      >
        <SectionToolbar
          action={
            <ActionButton onClick={startCreateCourse} type="button">
              Crear curso
            </ActionButton>
          }
          helper={`${filteredCourses.length} cursos visibles con el filtro actual · ${courseTemplates.length} plantillas disponibles para acelerar carga editorial.`}
        >
          <FilterInput
            onChange={(event) => updateViewFilter("courses", event.target.value)}
            placeholder="Filtrar cursos por nombre, formato, publico o descripcion"
            value={viewFilters.courses}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCourses.length ? (
              filteredCourses.map((course) => (
                <RowCard
                  key={course.id}
                  eyebrow={`${course.format} · ${course.duration}`}
                  title={course.title}
                  meta={course.audience}
                  body={course.description}
                >
                  <SecondaryButton onClick={() => startEditCourse(course)} type="button">
                    Editar
                  </SecondaryButton>
                  <SecondaryButton onClick={() => deleteCollectionItem("courses", course.id)} type="button">
                    Eliminar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay cursos que coincidan" body="Empieza con un curso nuevo o ajusta el filtro actual." />
            )}
          </div>
        </ScrollArea>
      </SectionCard>

      <SectionCard
        title="Cohortes y grupos"
        description="Configura grupos concretos por curso para organizar entradas, fechas, cupo y visibilidad del leaderboard antes de enlazar matriculas."
      >
        <SectionToolbar
          action={
            <ActionButton onClick={startCreateCohort} type="button">
              Crear cohorte
            </ActionButton>
          }
          helper={`${filteredCohorts.length} cohortes visibles con el filtro actual.`}
        >
          <FilterInput
            onChange={(event) => updateViewFilter("cohorts", event.target.value)}
            placeholder="Filtrar cohortes por nombre, curso, estado o docente"
            value={viewFilters.cohorts}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCohorts.length ? (
              filteredCohorts.map((cohort) => (
                <RowCard
                  key={cohort.id}
                  eyebrow={`${cohort.statusLabel || cohort.status || "planificada"} · ${cohort.startDateLabel || "sin inicio"}${cohort.endDateLabel ? ` a ${cohort.endDateLabel}` : ""}`}
                  title={cohort.title}
                  meta={[cohort.courseTitle, cohort.teacherLabel, cohort.capacityLabel].filter(Boolean).join(" · ")}
                  body={cohort.description || "Sin descripcion operativa para esta cohorte."}
                >
                  <SecondaryButton onClick={() => startEditCohort(cohort)} type="button">
                    Editar
                  </SecondaryButton>
                  <SecondaryButton onClick={() => deleteCollectionItem("cohorts", cohort.id)} type="button">
                    Eliminar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay cohortes que coincidan" body="Crea una cohorte nueva o ajusta el filtro actual." />
            )}
          </div>
        </ScrollArea>
      </SectionCard>
    </div>
  );
}
