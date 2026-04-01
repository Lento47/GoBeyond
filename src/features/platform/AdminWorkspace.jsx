import { useEffect, useMemo, useState } from "react";

const initialSessionForm = {
  id: "",
  title: "",
  date: "",
  format: "Sincronica",
};

const initialLearningForm = {
  id: "",
  title: "",
  type: "Asincronico",
  status: "",
};

const initialCourseForm = {
  id: "",
  title: "",
  audience: "",
  format: "",
  duration: "",
  description: "",
  outcomes: "",
};

const initialUserForm = {
  id: "",
  fullName: "",
  email: "",
  password: "",
  role: "student",
  status: "active",
};

const initialEnrollmentForm = {
  id: "",
  userId: "",
  courseId: "",
  accessDays: "45",
  accessExpiresAt: "",
  status: "active",
};

const initialTestimonialForm = {
  quote: "",
  author: "",
  organization: "",
};

function SectionCard({ title, description, children, accent = "soft" }) {
  return (
    <section
      className={`overflow-hidden border p-6 shadow-[0_22px_48px_rgba(32,24,31,0.05)] ${
        accent === "dark"
          ? "border-[#2f2630] bg-[#20181f] text-white"
          : "border-[#d8cdbf] bg-white/90"
      }`}
    >
      <div className="mb-5">
        <h3 className="font-['Georgia'] text-2xl">{title}</h3>
        <p className={`mt-2 text-sm ${accent === "dark" ? "text-[#d8cdc5]" : "text-[#6d5a51]"}`}>{description}</p>
      </div>
      {children}
    </section>
  );
}

function Input(props) {
  return <input className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" {...props} />;
}

function Textarea(props) {
  return (
    <textarea
      className="min-h-[120px] w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]"
      {...props}
    />
  );
}

function Select(props) {
  return <select className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" {...props} />;
}

function SmallStat({ label, value, help }) {
  return (
    <div className="border border-[#eadfce] bg-[#fbf8f2] p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{label}</p>
      <p className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">{value}</p>
      <p className="mt-2 text-sm text-[#6d5a51]">{help}</p>
    </div>
  );
}

function PillButton({ active, children, ...props }) {
  return (
    <button
      className={`px-4 py-2 text-sm transition ${
        active ? "bg-[#20181f] text-white" : "border border-[#d8cdbf] bg-white text-[#5c4d46]"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, ...props }) {
  return (
    <button className="bg-[#20181f] px-4 py-3 text-sm text-white transition hover:bg-[#342935]" {...props}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button className="border border-[#d8cdbf] px-4 py-3 text-sm text-[#20181f] transition hover:bg-[#fbf8f2]" {...props}>
      {children}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#20181f]/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto border border-[#d8cdbf] bg-[#f7f1e7] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="sticky top-0 z-10 border-b border-[#d8cdbf] bg-[#f7f1e7] px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Editor</p>
              <h3 className="mt-2 font-['Georgia'] text-3xl text-[#20181f]">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm text-[#6d5a51]">{subtitle}</p>
            </div>
            <SecondaryButton onClick={onClose} type="button">
              Cerrar
            </SecondaryButton>
          </div>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="border border-dashed border-[#cbb8a4] bg-[#fbf8f2] p-6 text-[#5c4d46]">
      <p className="font-medium text-[#20181f]">{title}</p>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

function RowCard({ eyebrow, title, meta, body, children }) {
  return (
    <div className="border border-[#eadfce] bg-[#fbf8f2] p-5">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{eyebrow}</p> : null}
      <h4 className="mt-2 text-xl font-medium text-[#20181f]">{title}</h4>
      {meta ? <p className="mt-2 text-sm text-[#6d5a51]">{meta}</p> : null}
      {body ? <p className="mt-3 text-sm text-[#5c4d46]">{body}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha definida";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function AdminWorkspace({
  authError,
  content,
  createCollectionItem,
  createEnrollment,
  createUser,
  currentUser,
  deleteCollectionItem,
  enrollments,
  enrollmentsLoading,
  onLogout,
  removeEnrollment,
  updateCollectionItem,
  updateEnrollment,
  updateSection,
  updateUser,
  users,
  usersLoading,
}) {
  const [activeView, setActiveView] = useState("identity");
  const [modal, setModal] = useState(null);
  const [brandForm, setBrandForm] = useState(content.brand);
  const [heroForm, setHeroForm] = useState(content.hero);
  const [landingForm, setLandingForm] = useState(content.landing);
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [learningForm, setLearningForm] = useState(initialLearningForm);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [testimonialForm, setTestimonialForm] = useState(initialTestimonialForm);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    setBrandForm(content.brand);
    setHeroForm(content.hero);
    setLandingForm(content.landing);
  }, [content]);

  const studentOptions = useMemo(() => users.filter((user) => user.role === "student"), [users]);

  function closeModal() {
    setModal(null);
  }

  function openModal(nextModal) {
    setWorkspaceError("");
    setWorkspaceMessage("");
    setModal(nextModal);
  }

  async function runAction(action, successMessage, { closeAfter = false } = {}) {
    setWorkspaceMessage("");
    setWorkspaceError("");

    try {
      await action();
      setWorkspaceMessage(successMessage);
      if (closeAfter) {
        closeModal();
      }
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  function normalizeLandingForm() {
    return {
      ...landingForm,
      trustItems: String(landingForm.trustItems ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  function startCreateSession() {
    setSessionForm(initialSessionForm);
    openModal("session");
  }

  function startEditSession(item) {
    setSessionForm({
      id: item.id,
      title: item.title,
      date: item.date,
      format: item.format,
    });
    openModal("session");
  }

  function startCreateLearning() {
    setLearningForm(initialLearningForm);
    openModal("learning");
  }

  function startEditLearning(item) {
    setLearningForm({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
    });
    openModal("learning");
  }

  function startCreateCourse() {
    setCourseForm(initialCourseForm);
    openModal("course");
  }

  function startEditCourse(item) {
    setCourseForm({
      id: item.id,
      title: item.title,
      audience: item.audience,
      format: item.format,
      duration: item.duration,
      description: item.description,
      outcomes: item.outcomes,
    });
    openModal("course");
  }

  function startCreateUser() {
    setUserForm(initialUserForm);
    openModal("user");
  }

  function startEditUser(user) {
    setUserForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    openModal("user");
  }

  function startCreateEnrollment() {
    setEnrollmentForm(initialEnrollmentForm);
    openModal("enrollment");
  }

  function startEditEnrollment(item) {
    setEnrollmentForm({
      id: item.id,
      userId: item.userId,
      courseId: item.courseId,
      accessDays: "45",
      accessExpiresAt: item.accessExpiresAt?.slice(0, 10) ?? "",
      status: item.status,
    });
    openModal("enrollment");
  }

  function startCreateTestimonial() {
    setTestimonialForm(initialTestimonialForm);
    openModal("testimonial");
  }

  async function saveBrand(event) {
    event.preventDefault();
    await runAction(() => updateSection("brand", brandForm), "Marca actualizada.", { closeAfter: true });
  }

  async function saveHero(event) {
    event.preventDefault();
    await runAction(() => updateSection("hero", heroForm), "Hero actualizado.", { closeAfter: true });
  }

  async function saveLanding(event) {
    event.preventDefault();
    await runAction(
      () => updateSection("landing", normalizeLandingForm()),
      "Narrativa institucional actualizada.",
      { closeAfter: true }
    );
  }

  async function saveSession(event) {
    event.preventDefault();
    await runAction(
      () =>
        sessionForm.id
          ? updateCollectionItem("liveSessions", sessionForm.id, sessionForm)
          : createCollectionItem("liveSessions", sessionForm),
      sessionForm.id ? "Sesion actualizada." : "Sesion creada.",
      { closeAfter: true }
    );
  }

  async function saveLearning(event) {
    event.preventDefault();
    await runAction(
      () =>
        learningForm.id
          ? updateCollectionItem("learningPath", learningForm.id, learningForm)
          : createCollectionItem("learningPath", learningForm),
      learningForm.id ? "Modulo actualizado." : "Modulo creado.",
      { closeAfter: true }
    );
  }

  async function saveCourse(event) {
    event.preventDefault();
    const payload = {
      id: courseForm.id,
      title: courseForm.title,
      audience: courseForm.audience,
      format: courseForm.format,
      duration: courseForm.duration,
      description: courseForm.description,
      outcomes: courseForm.outcomes,
    };

    await runAction(
      () =>
        courseForm.id
          ? updateCollectionItem("courses", courseForm.id, payload)
          : createCollectionItem("courses", payload),
      courseForm.id ? "Curso actualizado." : "Curso creado.",
      { closeAfter: true }
    );
  }

  async function saveUser(event) {
    event.preventDefault();
    const payload = {
      fullName: userForm.fullName,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      ...(userForm.password ? { password: userForm.password } : {}),
    };

    await runAction(
      () => (userForm.id ? updateUser(userForm.id, payload) : createUser({ ...payload, password: userForm.password })),
      userForm.id ? "Usuario actualizado." : "Usuario creado.",
      { closeAfter: true }
    );
  }

  async function saveEnrollment(event) {
    event.preventDefault();
    const payload = enrollmentForm.id
      ? {
          status: enrollmentForm.status,
          accessExpiresAt: enrollmentForm.accessExpiresAt,
        }
      : {
          userId: enrollmentForm.userId,
          courseId: enrollmentForm.courseId,
          accessDays: enrollmentForm.accessDays,
          status: enrollmentForm.status,
        };

    await runAction(
      () => (enrollmentForm.id ? updateEnrollment(enrollmentForm.id, payload) : createEnrollment(payload)),
      enrollmentForm.id ? "Matricula actualizada." : "Matricula creada.",
      { closeAfter: true }
    );
  }

  async function saveTestimonial(event) {
    event.preventDefault();
    await runAction(
      () =>
        createCollectionItem("testimonials", {
          ...testimonialForm,
          status: "approved",
        }),
      "Testimonio publicado.",
      { closeAfter: true }
    );
  }

  async function approveTestimonialSubmission(item) {
    await runAction(
      async () => {
        await createCollectionItem("testimonials", {
          quote: item.quote,
          author: item.author,
          organization: item.organization,
          status: "approved",
        });
        await deleteCollectionItem("testimonialSubmissions", item.id);
      },
      "Testimonio aprobado."
    );
  }

  function renderIdentityView() {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="Identidad y narrativa"
          description="Todo el contenido institucional vive aqui, pero ya no te obliga a convivir con formularios abiertos todo el tiempo."
        >
          <div className="grid gap-4 lg:grid-cols-3">
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
              meta={`${content.landing.trustItems?.length ?? 0} aliados visibles`}
              body={content.landing.contactBody}
            >
              <ActionButton onClick={() => openModal("landing")} type="button">
                Editar narrativa
              </ActionButton>
            </RowCard>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Sesiones en vivo" description="Crea o ajusta encuentros sin exponer un formulario perpetuo en pantalla.">
            <div className="mb-5 flex justify-end">
              <ActionButton onClick={startCreateSession} type="button">
                Crear sesion
              </ActionButton>
            </div>
            <div className="grid gap-4">
              {content.liveSessions.length ? (
                content.liveSessions.map((item) => (
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
                  title="Aun no hay sesiones creadas"
                  body="Cuando agregues una nueva, aparecera aqui en fila y no dentro de un bloque de formulario."
                />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Ruta de aprendizaje" description="La ruta se administra como piezas ordenadas, no como campos sueltos.">
            <div className="mb-5 flex justify-end">
              <ActionButton onClick={startCreateLearning} type="button">
                Crear modulo
              </ActionButton>
            </div>
            <div className="grid gap-4">
              {content.learningPath.length ? (
                content.learningPath.map((item) => (
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
                <EmptyState title="No hay modulos aun" body="Crea el primero desde el boton superior." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  function renderCatalogView() {
    return (
      <SectionCard
        title="Catalogo de cursos"
        description="Ahora el catalogo se gestiona como una lista limpia. Cada accion abre un editor encima con preview antes de guardar."
      >
        <div className="mb-5 flex justify-end">
          <ActionButton onClick={startCreateCourse} type="button">
            Crear curso
          </ActionButton>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {content.courses?.length ? (
            content.courses.map((course) => (
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
            <EmptyState title="No hay cursos creados" body="Empieza con un curso nuevo y lo veras agregado aqui inmediatamente." />
          )}
        </div>
      </SectionCard>
    );
  }

  function renderPeopleView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Usuarios y roles"
          description="Gestiona administradores, docentes y estudiantes desde un listado mas legible, sin dejar los campos abiertos en la misma pantalla."
        >
          <div className="mb-5 flex justify-end">
            <ActionButton onClick={startCreateUser} type="button">
              Crear usuario
            </ActionButton>
          </div>
          <div className="grid gap-4">
            {usersLoading ? <p className="text-sm text-[#6d5a51]">Cargando usuarios...</p> : null}
            {users.length ? (
              users.map((user) => (
                <RowCard
                  key={user.id}
                  eyebrow={`${user.role} · ${user.status}`}
                  title={user.fullName}
                  meta={user.email}
                  body={`Creado el ${formatDate(user.createdAt)}`}
                >
                  <SecondaryButton onClick={() => startEditUser(user)} type="button">
                    Editar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="Aun no hay usuarios" body="Crea la primera cuenta desde el boton superior." />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Matriculas y acceso"
          description="Cada matricula vive como una fila editable con fecha de vencimiento, ideal para el acceso limitado de 45 dias."
        >
          <div className="mb-5 flex justify-end">
            <ActionButton onClick={startCreateEnrollment} type="button">
              Crear matricula
            </ActionButton>
          </div>
          <div className="grid gap-4">
            {enrollmentsLoading ? <p className="text-sm text-[#6d5a51]">Cargando matriculas...</p> : null}
            {enrollments.length ? (
              enrollments.map((item) => (
                <RowCard
                  key={item.id}
                  eyebrow={`${item.status} · vence ${formatDate(item.accessExpiresAt)}`}
                  title={item.student.fullName}
                  meta={item.course?.title ?? item.courseId}
                  body={item.student.email}
                >
                  <SecondaryButton onClick={() => startEditEnrollment(item)} type="button">
                    Editar
                  </SecondaryButton>
                  <SecondaryButton onClick={() => removeEnrollment(item.id)} type="button">
                    Eliminar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState
                title="No hay matriculas creadas"
                body="Cuando asignes un curso a un estudiante, aparecera aqui con su fecha de expiracion."
              />
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  function renderCommunityView() {
    return (
      <SectionCard
        title="Testimonios y comunidad"
        description="Publica testimonios desde un editor limpio y modera lo que llega del formulario publico sin saturar la pantalla."
      >
        <div className="mb-5 flex justify-end">
          <ActionButton onClick={startCreateTestimonial} type="button">
            Crear testimonio
          </ActionButton>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {content.testimonials?.length ? (
            content.testimonials.map((item) => (
              <RowCard key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                <SecondaryButton onClick={() => deleteCollectionItem("testimonials", item.id)} type="button">
                  Eliminar
                </SecondaryButton>
              </RowCard>
            ))
          ) : (
            <EmptyState title="Aun no hay testimonios publicados" body="Crea el primero desde el boton superior." />
          )}
        </div>

        <div className="mt-8 border-t border-[#eadfce] pt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Moderacion</p>
              <h4 className="mt-2 font-['Georgia'] text-2xl text-[#20181f]">Pendientes de aprobacion</h4>
            </div>
            <p className="text-sm text-[#6d5a51]">{content.testimonialSubmissions?.length ?? 0} esperando revision</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {content.testimonialSubmissions?.length ? (
              content.testimonialSubmissions.map((item) => (
                <RowCard key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                  <ActionButton onClick={() => approveTestimonialSubmission(item)} type="button">
                    Aprobar
                  </ActionButton>
                  <SecondaryButton onClick={() => deleteCollectionItem("testimonialSubmissions", item.id)} type="button">
                    Rechazar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="Todo al dia" body="No hay testimonios esperando moderacion en este momento." />
            )}
          </div>
        </div>
      </SectionCard>
    );
  }

  function renderModal() {
    if (!modal) {
      return null;
    }

    if (modal === "brand") {
      return (
        <ModalShell
          title="Editar marca"
          subtitle="Aqui ajustas nombre, tagline y descripcion institucional."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveBrand}>
            <Input value={brandForm.name} onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })} placeholder="Nombre del proyecto" />
            <Input value={brandForm.tagline} onChange={(event) => setBrandForm({ ...brandForm, tagline: event.target.value })} placeholder="Tagline" />
            <Textarea value={brandForm.description} onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })} placeholder="Descripcion" />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar marca</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "hero") {
      return (
        <ModalShell
          title="Editar hero"
          subtitle="Ajusta la promesa principal del landing sin mezclarla con otras acciones del panel."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveHero}>
            <Input value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} placeholder="Eyebrow" />
            <Input value={heroForm.title} onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })} placeholder="Titulo" />
            <Textarea value={heroForm.description} onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })} placeholder="Descripcion" />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar hero</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "landing") {
      return (
        <ModalShell
          title="Editar narrativa institucional"
          subtitle="Usa este editor para la historia principal, aliados y bloque de contacto del landing."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveLanding}>
            <Input value={landingForm.aboutTitle} onChange={(event) => setLandingForm({ ...landingForm, aboutTitle: event.target.value })} placeholder="Titulo sobre nosotros" />
            <Textarea value={landingForm.aboutBody} onChange={(event) => setLandingForm({ ...landingForm, aboutBody: event.target.value })} placeholder="Texto principal" />
            <Textarea value={landingForm.aboutBodyTwo} onChange={(event) => setLandingForm({ ...landingForm, aboutBodyTwo: event.target.value })} placeholder="Texto secundario" />
            <Textarea value={landingForm.relevanceBody} onChange={(event) => setLandingForm({ ...landingForm, relevanceBody: event.target.value })} placeholder="Texto de relevancia laboral" />
            <Input
              value={Array.isArray(landingForm.trustItems) ? landingForm.trustItems.join(", ") : landingForm.trustItems}
              onChange={(event) => setLandingForm({ ...landingForm, trustItems: event.target.value })}
              placeholder="Aliados separados por coma"
            />
            <Textarea value={landingForm.contactBody} onChange={(event) => setLandingForm({ ...landingForm, contactBody: event.target.value })} placeholder="Texto de contacto" />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar narrativa</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "session") {
      return (
        <ModalShell
          title={sessionForm.id ? "Editar sesion" : "Crear sesion"}
          subtitle="Cada sesion aparece luego como fila en la vista principal, sin saturar el panel con formularios permanentes."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveSession}>
              <Input value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} placeholder="Titulo de la sesion" />
              <Input value={sessionForm.date} onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })} placeholder="Fecha o horario" />
              <Select value={sessionForm.format} onChange={(event) => setSessionForm({ ...sessionForm, format: event.target.value })}>
                <option value="Sincronica">Sincronica</option>
                <option value="Asincronica">Asincronica</option>
              </Select>
              <div className="flex gap-3">
                <ActionButton type="submit">{sessionForm.id ? "Guardar cambios" : "Crear sesion"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={sessionForm.format || "Sesion"}
              title={sessionForm.title || "Titulo de la sesion"}
              meta={sessionForm.date || "Fecha o horario"}
              body="Vista previa de como se ordenara esta sesion dentro del listado principal."
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "learning") {
      return (
        <ModalShell
          title={learningForm.id ? "Editar modulo" : "Crear modulo"}
          subtitle="Piensa cada item como una pieza breve y clara dentro de la ruta de aprendizaje."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveLearning}>
              <Input value={learningForm.title} onChange={(event) => setLearningForm({ ...learningForm, title: event.target.value })} placeholder="Titulo del modulo" />
              <Select value={learningForm.type} onChange={(event) => setLearningForm({ ...learningForm, type: event.target.value })}>
                <option value="Asincronico">Asincronico</option>
                <option value="Sincronico">Sincronico</option>
                <option value="Mentoria">Mentoria</option>
              </Select>
              <Textarea value={learningForm.status} onChange={(event) => setLearningForm({ ...learningForm, status: event.target.value })} placeholder="Estado o enfoque del modulo" />
              <div className="flex gap-3">
                <ActionButton type="submit">{learningForm.id ? "Guardar cambios" : "Crear modulo"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={learningForm.type || "Ruta"}
              title={learningForm.title || "Titulo del modulo"}
              body={learningForm.status || "La descripcion breve del modulo aparecera aqui como vista previa."}
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "course") {
      return (
        <ModalShell
          title={courseForm.id ? "Editar curso" : "Crear curso"}
          subtitle="Aqui trabajas el curso completo y a la derecha ves un preview cercano a la tarjeta final que vera el estudiante."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveCourse}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} placeholder="Nombre del curso" />
                <Input value={courseForm.audience} onChange={(event) => setCourseForm({ ...courseForm, audience: event.target.value })} placeholder="Publico objetivo" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={courseForm.format} onChange={(event) => setCourseForm({ ...courseForm, format: event.target.value })} placeholder="Formato" />
                <Input value={courseForm.duration} onChange={(event) => setCourseForm({ ...courseForm, duration: event.target.value })} placeholder="Duracion" />
              </div>
              <Textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} placeholder="Descripcion del curso" />
              <Textarea value={courseForm.outcomes} onChange={(event) => setCourseForm({ ...courseForm, outcomes: event.target.value })} placeholder="Resultados esperados" />
              <div className="flex gap-3">
                <ActionButton type="submit">{courseForm.id ? "Guardar cambios" : "Crear curso"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <article className="border border-[#d8cdbf] bg-white p-7">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">
                {(courseForm.format || "Formato") + " · " + (courseForm.duration || "Duracion")}
              </p>
              <h3 className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">{courseForm.title || "Nombre del curso"}</h3>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#8b6d55]">
                {courseForm.audience || "Publico objetivo"}
              </p>
              <p className="mt-4 text-[#5c4d46]">
                {courseForm.description || "La descripcion aparecera aqui para que puedas revisar tono y claridad antes de guardar."}
              </p>
              <p className="mt-4 border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                <strong className="text-[#20181f]">Resultados esperados:</strong>{" "}
                {courseForm.outcomes || "Los resultados del curso se mostraran aqui como vista previa."}
              </p>
            </article>
          </div>
        </ModalShell>
      );
    }

    if (modal === "user") {
      return (
        <ModalShell
          title={userForm.id ? "Editar usuario" : "Crear usuario"}
          subtitle="Este editor concentra el alta y la gestion de roles para que no tengas una tabla llena de inputs abiertos."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveUser}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Nombre completo" />
                <Input
                  value={userForm.email}
                  disabled={Boolean(userForm.id)}
                  onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                  placeholder="Correo electronico"
                />
              </div>
              {!userForm.id ? (
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder="Contrasena temporal"
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <Select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </Select>
                <Select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </Select>
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">{userForm.id ? "Guardar cambios" : "Crear usuario"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={`${userForm.role || "student"} · ${userForm.status || "active"}`}
              title={userForm.fullName || "Nombre del usuario"}
              meta={userForm.email || "correo@dominio.com"}
              body="Vista previa de como quedara esta cuenta dentro del listado administrativo."
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "enrollment") {
      return (
        <ModalShell
          title={enrollmentForm.id ? "Editar matricula" : "Crear matricula"}
          subtitle="Asigna un curso y acceso temporal sin llenar la pantalla principal de campos y selectores."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveEnrollment}>
              {!enrollmentForm.id ? (
                <>
                  <Select value={enrollmentForm.userId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, userId: event.target.value })}>
                    <option value="">Selecciona estudiante</option>
                    {studentOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} · {user.email}
                      </option>
                    ))}
                  </Select>
                  <Select value={enrollmentForm.courseId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, courseId: event.target.value })}>
                    <option value="">Selecciona curso</option>
                    {(content.courses ?? []).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={enrollmentForm.accessDays}
                    onChange={(event) => setEnrollmentForm({ ...enrollmentForm, accessDays: event.target.value })}
                    placeholder="Dias de acceso"
                  />
                </>
              ) : (
                <Input
                  type="date"
                  value={enrollmentForm.accessExpiresAt}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, accessExpiresAt: event.target.value })}
                  placeholder="Fecha de vencimiento"
                />
              )}

              <Select value={enrollmentForm.status} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, status: event.target.value })}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="expired">expired</option>
              </Select>

              <div className="flex gap-3">
                <ActionButton type="submit">{enrollmentForm.id ? "Guardar cambios" : "Crear matricula"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={enrollmentForm.status || "active"}
              title={
                enrollmentForm.courseId
                  ? content.courses?.find((course) => course.id === enrollmentForm.courseId)?.title ?? "Curso seleccionado"
                  : "Curso seleccionado"
              }
              meta={
                enrollmentForm.userId
                  ? studentOptions.find((user) => user.id === enrollmentForm.userId)?.fullName ?? "Estudiante seleccionado"
                  : "Estudiante seleccionado"
              }
              body={
                enrollmentForm.id
                  ? `Vence el ${enrollmentForm.accessExpiresAt || "sin fecha definida"}.`
                  : `Acceso estimado por ${enrollmentForm.accessDays || "45"} dias.`
              }
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "testimonial") {
      return (
        <ModalShell
          title="Crear testimonio"
          subtitle="Publica un testimonio nuevo y revisa arriba el tono antes de enviarlo al listado."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveTestimonial}>
              <Textarea value={testimonialForm.quote} onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })} placeholder="Testimonio" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={testimonialForm.author} onChange={(event) => setTestimonialForm({ ...testimonialForm, author: event.target.value })} placeholder="Nombre" />
                <Input value={testimonialForm.organization} onChange={(event) => setTestimonialForm({ ...testimonialForm, organization: event.target.value })} placeholder="Institucion o referencia" />
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">Publicar testimonio</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              title={testimonialForm.author || "Nombre del estudiante o aliado"}
              meta={testimonialForm.organization || "Organizacion"}
              body={`“${testimonialForm.quote || "El testimonio aparecera aqui como vista previa antes de publicarlo."}”`}
            />
          </div>
        </ModalShell>
      );
    }

    return null;
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Cabina administrativa"
        description="Todo cambio queda registrado en backend. Ahora las acciones viven en vistas mas limpias y modales enfocados, no en una sola pagina saturada."
        accent="dark"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-[#d8cdc5]">
              <strong>{currentUser.fullName}</strong> · {currentUser.email}
            </p>
            <p className="mt-1 text-sm text-[#d8cdc5]">
              Rol: {currentUser.role} · Estado: {currentUser.status}
            </p>
          </div>
          <button className="w-fit border border-white/25 px-4 py-2 text-sm text-white" onClick={onLogout} type="button">
            Cerrar sesion
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SmallStat label="Cursos" value={content.courses?.length ?? 0} help="Programas visibles para captacion y aprendizaje." />
          <SmallStat label="Usuarios" value={users.length} help="Cuentas administrables desde la UI." />
          <SmallStat label="Matriculas" value={enrollments.length} help="Accesos activos o historicos por estudiante." />
          <SmallStat label="Pendientes" value={content.testimonialSubmissions?.length ?? 0} help="Testimonios esperando moderacion." />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <PillButton active={activeView === "identity"} onClick={() => setActiveView("identity")} type="button">
            Identidad
          </PillButton>
          <PillButton active={activeView === "catalog"} onClick={() => setActiveView("catalog")} type="button">
            Cursos
          </PillButton>
          <PillButton active={activeView === "people"} onClick={() => setActiveView("people")} type="button">
            Personas
          </PillButton>
          <PillButton active={activeView === "community"} onClick={() => setActiveView("community")} type="button">
            Comunidad
          </PillButton>
        </div>

        {authError ? <p className="mt-4 text-sm text-[#ffb8a6]">{authError}</p> : null}
        {workspaceError ? <p className="mt-4 text-sm text-[#ffb8a6]">{workspaceError}</p> : null}
        {workspaceMessage ? <p className="mt-4 text-sm text-[#f4d9b2]">{workspaceMessage}</p> : null}
      </SectionCard>

      {activeView === "identity" ? renderIdentityView() : null}
      {activeView === "catalog" ? renderCatalogView() : null}
      {activeView === "people" ? renderPeopleView() : null}
      {activeView === "community" ? renderCommunityView() : null}

      {renderModal()}
    </div>
  );
}
