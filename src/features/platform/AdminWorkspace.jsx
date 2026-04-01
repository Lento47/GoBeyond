import { useEffect, useState } from "react";

function SectionCard({ title, description, children, accent = "soft" }) {
  return (
    <section
      className={`overflow-hidden border p-6 shadow-[0_20px_40px_rgba(32,24,31,0.05)] ${
        accent === "dark"
          ? "border-[#2f2630] bg-[#20181f] text-white"
          : "border-[#d8cdbf] bg-white/85"
      }`}
    >
      <div className="mb-5">
        <h3 className="font-['Georgia'] text-2xl">{title}</h3>
        <p className={`mt-2 text-sm ${accent === "dark" ? "text-[#d8cdc5]" : "text-[#6d5a51]"}`}>
          {description}
        </p>
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
  const [brandForm, setBrandForm] = useState(content.brand);
  const [heroForm, setHeroForm] = useState(content.hero);
  const [landingForm, setLandingForm] = useState(content.landing);
  const [sessionForm, setSessionForm] = useState({ title: "", date: "", format: "Sincronica" });
  const [pathForm, setPathForm] = useState({ title: "", type: "Asincronico", status: "" });
  const [testimonialForm, setTestimonialForm] = useState({ quote: "", author: "", organization: "" });
  const [courseForm, setCourseForm] = useState({
    id: "",
    title: "",
    audience: "",
    format: "",
    duration: "",
    description: "",
    outcomes: "",
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    status: "active",
  });
  const [enrollmentForm, setEnrollmentForm] = useState({
    userId: "",
    courseId: "",
    accessDays: "45",
    status: "active",
  });
  const [userDrafts, setUserDrafts] = useState({});
  const [enrollmentDrafts, setEnrollmentDrafts] = useState({});
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    setBrandForm(content.brand);
    setHeroForm(content.hero);
    setLandingForm(content.landing);
  }, [content]);

  useEffect(() => {
    setUserDrafts(
      Object.fromEntries(
        users.map((user) => [
          user.id,
          {
            fullName: user.fullName,
            role: user.role,
            status: user.status,
          },
        ])
      )
    );
  }, [users]);

  useEffect(() => {
    setEnrollmentDrafts(
      Object.fromEntries(
        enrollments.map((item) => [
          item.id,
          {
            status: item.status,
            accessExpiresAt: item.accessExpiresAt?.slice(0, 10) ?? "",
          },
        ])
      )
    );
  }, [enrollments]);

  const studentOptions = users.filter((user) => user.role === "student");

  async function runAction(action, successMessage) {
    setWorkspaceMessage("");
    setWorkspaceError("");

    try {
      await action();
      setWorkspaceMessage(successMessage);
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

  function resetCourseForm() {
    setCourseForm({
      id: "",
      title: "",
      audience: "",
      format: "",
      duration: "",
      description: "",
      outcomes: "",
    });
  }

  async function saveBrand(event) {
    event.preventDefault();
    await runAction(() => updateSection("brand", brandForm), "Marca actualizada.");
  }

  async function saveHero(event) {
    event.preventDefault();
    await runAction(() => updateSection("hero", heroForm), "Hero principal actualizado.");
  }

  async function saveLanding(event) {
    event.preventDefault();
    await runAction(() => updateSection("landing", normalizeLandingForm()), "Contenido institucional actualizado.");
  }

  async function addSession(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await createCollectionItem("liveSessions", sessionForm);
        setSessionForm({ title: "", date: "", format: "Sincronica" });
      },
      "Sesion creada."
    );
  }

  async function addLearningItem(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await createCollectionItem("learningPath", pathForm);
        setPathForm({ title: "", type: "Asincronico", status: "" });
      },
      "Modulo agregado a la ruta."
    );
  }

  async function addTestimonial(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await createCollectionItem("testimonials", {
          ...testimonialForm,
          status: "approved",
        });
        setTestimonialForm({ quote: "", author: "", organization: "" });
      },
      "Testimonio publicado."
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

  async function saveCourse(event) {
    event.preventDefault();

    await runAction(
      async () => {
        const payload = {
          title: courseForm.title,
          audience: courseForm.audience,
          format: courseForm.format,
          duration: courseForm.duration,
          description: courseForm.description,
          outcomes: courseForm.outcomes,
        };

        if (courseForm.id) {
          await updateCollectionItem("courses", courseForm.id, { id: courseForm.id, ...payload });
        } else {
          await createCollectionItem("courses", payload);
        }

        resetCourseForm();
      },
      courseForm.id ? "Curso actualizado." : "Curso creado."
    );
  }

  async function saveUser(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await createUser(userForm);
        setUserForm({
          fullName: "",
          email: "",
          password: "",
          role: "student",
          status: "active",
        });
      },
      "Usuario creado."
    );
  }

  async function saveEnrollment(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await createEnrollment(enrollmentForm);
        setEnrollmentForm({
          userId: "",
          courseId: "",
          accessDays: "45",
          status: "active",
        });
      },
      "Matricula creada."
    );
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Cabina administrativa"
        description="Todo cambio queda registrado en backend. Aqui gobiernas marca, programas, personas y accesos."
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

        {authError ? <p className="mt-4 text-sm text-[#ffb8a6]">{authError}</p> : null}
        {workspaceError ? <p className="mt-4 text-sm text-[#ffb8a6]">{workspaceError}</p> : null}
        {workspaceMessage ? <p className="mt-4 text-sm text-[#f4d9b2]">{workspaceMessage}</p> : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Marca" description="Controla identidad, tono y descripcion institucional.">
          <form className="grid gap-4" onSubmit={saveBrand}>
            <Input value={brandForm.name} onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })} placeholder="Nombre del proyecto" />
            <Input value={brandForm.tagline} onChange={(event) => setBrandForm({ ...brandForm, tagline: event.target.value })} placeholder="Tagline" />
            <Textarea value={brandForm.description} onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })} placeholder="Descripcion" />
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Guardar marca</button>
          </form>
        </SectionCard>

        <SectionCard title="Hero" description="Ajusta la promesa principal del landing sin tocar codigo.">
          <form className="grid gap-4" onSubmit={saveHero}>
            <Input value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} placeholder="Eyebrow" />
            <Input value={heroForm.title} onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })} placeholder="Titulo" />
            <Textarea value={heroForm.description} onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })} placeholder="Descripcion" />
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Guardar hero</button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Narrativa institucional" description="Administra la historia, aliados y mensaje de conversion del landing.">
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
          <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Guardar contenido institucional</button>
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sesiones en vivo" description="Crea encuentros sincronicos o asincronicos desde la UI.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={addSession}>
            <Input value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} placeholder="Titulo de la sesion" />
            <Input value={sessionForm.date} onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })} placeholder="Fecha o horario" />
            <Select value={sessionForm.format} onChange={(event) => setSessionForm({ ...sessionForm, format: event.target.value })}>
              <option value="Sincronica">Sincronica</option>
              <option value="Asincronica">Asincronica</option>
            </Select>
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Crear sesion</button>
          </form>

          <div className="mt-5 grid gap-3">
            {content.liveSessions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border border-[#eadfce] px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[#6d5a51]">{item.date} · {item.format}</p>
                </div>
                <button className="text-sm text-[#8a3d31]" onClick={() => deleteCollectionItem("liveSessions", item.id)} type="button">Eliminar</button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Ruta de aprendizaje" description="Sostiene el relato pedagogico del proyecto y el portal estudiantil.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={addLearningItem}>
            <Input value={pathForm.title} onChange={(event) => setPathForm({ ...pathForm, title: event.target.value })} placeholder="Titulo del modulo" />
            <Select value={pathForm.type} onChange={(event) => setPathForm({ ...pathForm, type: event.target.value })}>
              <option value="Asincronico">Asincronico</option>
              <option value="Sincronico">Sincronico</option>
              <option value="Mentoria">Mentoria</option>
            </Select>
            <Input value={pathForm.status} onChange={(event) => setPathForm({ ...pathForm, status: event.target.value })} placeholder="Estado o enfoque" />
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Crear modulo</button>
          </form>

          <div className="mt-5 grid gap-3">
            {content.learningPath.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border border-[#eadfce] px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[#6d5a51]">{item.type} · {item.status}</p>
                </div>
                <button className="text-sm text-[#8a3d31]" onClick={() => deleteCollectionItem("learningPath", item.id)} type="button">Eliminar</button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Cursos y programas" description="Crea, edita y corrige cursos completos desde el panel.">
        <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={saveCourse}>
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
          <div className="flex flex-wrap gap-3">
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">
              {courseForm.id ? "Actualizar curso" : "Crear curso"}
            </button>
            {courseForm.id ? (
              <button className="w-fit border border-[#d8cdbf] px-5 py-3 text-sm" onClick={resetCourseForm} type="button">
                Cancelar edicion
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {content.courses?.map((course) => (
            <div key={course.id} className="border border-[#eadfce] bg-[#fbf8f2] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{course.format} · {course.duration}</p>
              <h4 className="mt-2 text-xl font-medium">{course.title}</h4>
              <p className="mt-2 text-sm text-[#6d5a51]">{course.audience}</p>
              <p className="mt-3 text-sm text-[#5c4d46]">{course.description}</p>
              <div className="mt-4 flex gap-4">
                <button className="text-sm text-[#20181f]" onClick={() => setCourseForm({ ...course, id: course.id })} type="button">
                  Editar
                </button>
                <button className="text-sm text-[#8a3d31]" onClick={() => deleteCollectionItem("courses", course.id)} type="button">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Usuarios y roles" description="Crea cuentas internas y ajusta su nivel de acceso sin compartir el bootstrap secret.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={saveUser}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Nombre completo" />
              <Input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="Correo electronico" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder="Contrasena temporal" />
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
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Crear usuario</button>
          </form>

          <div className="mt-5 grid gap-4">
            {usersLoading ? <p className="text-sm text-[#6d5a51]">Cargando usuarios...</p> : null}
            {users.map((user) => {
              const draft = userDrafts[user.id] ?? {
                fullName: user.fullName,
                role: user.role,
                status: user.status,
              };

              return (
                <div key={user.id} className="grid gap-3 border border-[#eadfce] bg-[#fbf8f2] p-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto] lg:items-end">
                  <div>
                    <p className="font-medium text-[#20181f]">{user.email}</p>
                    <Input
                      value={draft.fullName}
                      onChange={(event) =>
                        setUserDrafts((current) => ({
                          ...current,
                          [user.id]: { ...draft, fullName: event.target.value },
                        }))
                      }
                      placeholder="Nombre completo"
                    />
                  </div>
                  <Select
                    value={draft.role}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: { ...draft, role: event.target.value },
                      }))
                    }
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </Select>
                  <Select
                    value={draft.status}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: { ...draft, status: event.target.value },
                      }))
                    }
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </Select>
                  <button
                    className="w-fit bg-[#20181f] px-4 py-3 text-sm text-white"
                    onClick={() => runAction(() => updateUser(user.id, draft), "Usuario actualizado.")}
                    type="button"
                  >
                    Guardar
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Matriculas y acceso" description="Asignas cursos, dias de acceso y estado del estudiante desde una misma vista.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={saveEnrollment}>
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
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={enrollmentForm.accessDays} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, accessDays: event.target.value })} placeholder="Dias de acceso" />
              <Select value={enrollmentForm.status} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, status: event.target.value })}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="expired">expired</option>
              </Select>
            </div>
            <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Crear matricula</button>
          </form>

          <div className="mt-5 grid gap-4">
            {enrollmentsLoading ? <p className="text-sm text-[#6d5a51]">Cargando matriculas...</p> : null}
            {enrollments.map((item) => {
              const draft = enrollmentDrafts[item.id] ?? {
                status: item.status,
                accessExpiresAt: item.accessExpiresAt?.slice(0, 10) ?? "",
              };

              return (
                <div key={item.id} className="border border-[#eadfce] bg-[#fbf8f2] p-4">
                  <p className="font-medium text-[#20181f]">{item.student.fullName}</p>
                  <p className="mt-1 text-sm text-[#6d5a51]">{item.course?.title ?? item.courseId}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1fr_auto_auto] md:items-end">
                    <Select
                      value={draft.status}
                      onChange={(event) =>
                        setEnrollmentDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, status: event.target.value },
                        }))
                      }
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="completed">completed</option>
                      <option value="expired">expired</option>
                    </Select>
                    <Input
                      type="date"
                      value={draft.accessExpiresAt}
                      onChange={(event) =>
                        setEnrollmentDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, accessExpiresAt: event.target.value },
                        }))
                      }
                    />
                    <button
                      className="w-fit bg-[#20181f] px-4 py-3 text-sm text-white"
                      onClick={() => runAction(() => updateEnrollment(item.id, draft), "Matricula actualizada.")}
                      type="button"
                    >
                      Guardar
                    </button>
                    <button
                      className="w-fit border border-[#d8cdbf] px-4 py-3 text-sm"
                      onClick={() => runAction(() => removeEnrollment(item.id), "Matricula eliminada.")}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Testimonios" description="Publica testimonios internos y modera lo que llega desde el formulario publico.">
        <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={addTestimonial}>
          <Textarea value={testimonialForm.quote} onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })} placeholder="Testimonio" />
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={testimonialForm.author} onChange={(event) => setTestimonialForm({ ...testimonialForm, author: event.target.value })} placeholder="Nombre" />
            <Input value={testimonialForm.organization} onChange={(event) => setTestimonialForm({ ...testimonialForm, organization: event.target.value })} placeholder="Institucion o referencia" />
          </div>
          <button className="w-fit bg-[#20181f] px-5 py-3 text-sm text-white" type="submit">Publicar testimonio</button>
        </form>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {content.testimonials?.map((item) => (
            <div key={item.id} className="border border-[#eadfce] bg-[#fbf8f2] p-5">
              <p className="text-sm leading-7 text-[#5c4d46]">“{item.quote}”</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.author}</p>
                  <p className="text-sm text-[#6d5a51]">{item.organization}</p>
                </div>
                <button className="text-sm text-[#8a3d31]" onClick={() => deleteCollectionItem("testimonials", item.id)} type="button">Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-[#eadfce] pt-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Pendientes de aprobacion</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {content.testimonialSubmissions?.length ? (
              content.testimonialSubmissions.map((item) => (
                <div key={item.id} className="border border-[#eadfce] bg-white p-5">
                  <p className="text-sm leading-7 text-[#5c4d46]">“{item.quote}”</p>
                  <p className="mt-4 font-medium">{item.author}</p>
                  <p className="text-sm text-[#6d5a51]">{item.organization}</p>
                  <div className="mt-4 flex gap-3">
                    <button className="bg-[#20181f] px-4 py-2 text-sm text-white" onClick={() => approveTestimonialSubmission(item)} type="button">Aprobar</button>
                    <button className="border border-[#d8cdbf] px-4 py-2 text-sm" onClick={() => deleteCollectionItem("testimonialSubmissions", item.id)} type="button">Rechazar</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6d5a51]">No hay testimonios pendientes en este momento.</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
