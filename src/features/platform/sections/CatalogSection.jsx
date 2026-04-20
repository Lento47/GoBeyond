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
  deleteCollectionItem,
  filteredCourses,
  startCreateCourse,
  startEditCourse,
  updateViewFilter,
  viewFilters,
}) {
  return (
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
  );
}
