import {
  ActionButton,
  EmptyState,
  FilterInput,
  Input,
  RowCard,
  ScrollArea,
  Select,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
} from "../components/admin/AdminUI";

export function PeopleSection({
  expiredUsersCount,
  enrollmentsLoading,
  filteredCourseInterestRequests,
  filteredEnrollmentsByStudent,
  filteredUsers,
  formatDate,
  removeEnrollment,
  saveSecuritySettings,
  securitySettingsForm,
  setSecuritySettingsForm,
  startCreateEnrollment,
  startCreateEnrollmentForStudent,
  startCreateUser,
  startEditCourseInterest,
  startEditEnrollment,
  startEditUser,
  updateViewFilter,
  usersWithPasswordScheduleCount,
  usersLoading,
  viewFilters,
}) {
  function formatRoles(user) {
    return (user.roles ?? [user.role]).join(" / ");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="xl:col-span-2">
        <SectionCard
          title="Politica de acceso y verificacion"
          description="Aqui defines si administracion puede intervenir, si los estudiantes deben verificar su correo y cuando deben renovar su contrasena."
        >
          <SectionToolbar
            action={
              <ActionButton onClick={saveSecuritySettings} type="button">
                Guardar politica
              </ActionButton>
            }
            helper={`${expiredUsersCount} contrasenas vencidas · ${usersWithPasswordScheduleCount} cuentas con fecha proyectada de expiracion.`}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Expiracion automatica</p>
                <Select
                  value={securitySettingsForm.passwordExpirationEnabled ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      passwordExpirationEnabled: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="disabled">Desactivada</option>
                  <option value="enabled">Activada</option>
                </Select>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Dias para expirar</p>
                <Input
                  value={securitySettingsForm.passwordExpirationDays}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      passwordExpirationDays: event.target.value,
                    }))
                  }
                  placeholder="90"
                />
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Cambio manual por admin</p>
                <Select
                  value={securitySettingsForm.allowAdminPasswordChange ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      allowAdminPasswordChange: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="enabled">Permitido</option>
                  <option value="disabled">Bloqueado</option>
                </Select>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Enlace de recuperacion por admin</p>
                <Select
                  value={securitySettingsForm.allowAdminResetNotification ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      allowAdminResetNotification: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="enabled">Permitido</option>
                  <option value="disabled">Bloqueado</option>
                </Select>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Verificacion obligatoria</p>
                <Select
                  value={securitySettingsForm.requireEmailVerification ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      requireEmailVerification: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="enabled">Requerida</option>
                  <option value="disabled">Opcional</option>
                </Select>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Enlace de verificacion por admin</p>
                <Select
                  value={securitySettingsForm.allowAdminVerificationNotification ? "enabled" : "disabled"}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      allowAdminVerificationNotification: event.target.value === "enabled",
                    }))
                  }
                >
                  <option value="enabled">Permitido</option>
                  <option value="disabled">Bloqueado</option>
                </Select>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-[#dde5ee] bg-[#f8fafc] p-4 md:col-span-2 xl:col-span-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Correo visible de soporte</p>
                <Input
                  value={securitySettingsForm.supportEmail}
                  onChange={(event) =>
                    setSecuritySettingsForm((current) => ({
                      ...current,
                      supportEmail: event.target.value,
                    }))
                  }
                  placeholder="it@gobeyondcr.org"
                />
              </div>
            </div>
          </SectionToolbar>
        </SectionCard>
      </div>

      <SectionCard
        title="Usuarios y roles"
        description="Gestiona administradores, docentes y estudiantes desde un listado mas legible, sin dejar los campos abiertos en la misma pantalla."
      >
        <SectionToolbar
          action={
            <ActionButton onClick={startCreateUser} type="button">
              Crear usuario
            </ActionButton>
          }
        >
          <FilterInput
            onChange={(event) => updateViewFilter("users", event.target.value)}
            placeholder="Filtrar usuarios por nombre, correo, rol o estado"
            value={viewFilters.users}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4">
            {usersLoading ? <p className="text-sm text-[#617085]">Cargando usuarios...</p> : null}
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <RowCard
                  key={user.id}
                  eyebrow={`${formatRoles(user)} · ${user.status} · ${user.emailVerified ? "correo verificado" : "correo pendiente"} · ${user.passwordExpired ? "contrasena expirada" : "contrasena vigente"}`}
                  title={user.fullName}
                  meta={user.email}
                  body={`Creado el ${formatDate(user.createdAt)}${user.emailVerifiedAt ? ` · verificado ${formatDate(user.emailVerifiedAt)}` : " · sin verificacion aun"}${user.passwordExpiresAt ? ` · expira ${formatDate(user.passwordExpiresAt)}` : " · sin expiracion automatica"}`}
                >
                  <SecondaryButton onClick={() => startEditUser(user)} type="button">
                    Editar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay usuarios que coincidan" body="Crea una cuenta nueva o ajusta el filtro." />
            )}
          </div>
        </ScrollArea>
      </SectionCard>

      <SectionCard
        title="Matriculas y acceso"
        description="La base sigue guardando una matricula por curso, pero aqui se agrupa por estudiante para que el panel no se vuelva inmanejable."
      >
        <SectionToolbar
          action={
            <ActionButton onClick={startCreateEnrollment} type="button">
              Crear matricula
            </ActionButton>
          }
        >
          <FilterInput
            onChange={(event) => updateViewFilter("enrollments", event.target.value)}
            placeholder="Filtrar matriculas por estudiante, curso o estado"
            value={viewFilters.enrollments}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4">
            {enrollmentsLoading ? <p className="text-sm text-[#617085]">Cargando matriculas...</p> : null}
            {filteredEnrollmentsByStudent.length ? (
              filteredEnrollmentsByStudent.map((group) => (
                <div
                  key={group.student.id}
                  className="rounded-[1.15rem] border border-[#dfe6ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">
                        {group.items.length} {group.items.length === 1 ? "matricula" : "matriculas"}
                      </p>
                      <h4 className="mt-2 text-xl font-medium text-[#172033]">{group.student.fullName}</h4>
                      <p className="mt-2 text-sm text-[#617085]">{group.student.email}</p>
                    </div>
                    <ActionButton onClick={() => startCreateEnrollmentForStudent(group.student.id)} type="button">
                      Agregar curso
                    </ActionButton>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-[1rem] border border-[#dbe3ec] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-[#172033]">{item.course?.title ?? item.courseId}</p>
                            <p className="mt-1 text-sm text-[#617085]">
                              {item.status} · vence {formatDate(item.accessExpiresAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <SecondaryButton onClick={() => startEditEnrollment(item)} type="button">
                              Editar
                            </SecondaryButton>
                            <SecondaryButton onClick={() => removeEnrollment(item.id)} type="button">
                              Eliminar
                            </SecondaryButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No hay matriculas que coincidan"
                body="Cuando asignes un curso a un estudiante aparecera aqui, o puedes ajustar el filtro actual."
              />
            )}
          </div>
        </ScrollArea>
      </SectionCard>

      <SectionCard
        title="Solicitudes de apertura"
        description="Aqui ves a los estudiantes que mostraron interes en cursos aun no habilitados y dejaron un medio de contacto para seguimiento."
      >
        <SectionToolbar
          helper={`${filteredCourseInterestRequests.filter((item) => item.status === "open").length} abiertas · ${filteredCourseInterestRequests.length} visibles con el filtro actual.`}
        >
          <FilterInput
            onChange={(event) => updateViewFilter("courseRequests", event.target.value)}
            placeholder="Filtrar solicitudes por curso, estudiante, estado o contacto"
            value={viewFilters.courseRequests}
          />
        </SectionToolbar>
        <ScrollArea>
          <div className="grid gap-4">
            {filteredCourseInterestRequests.length ? (
              filteredCourseInterestRequests.map((item) => (
                <RowCard
                  key={item.id}
                  eyebrow={`${item.status || "open"} · ${item.contact?.channel || "contacto"}`}
                  title={item.courseTitle}
                  meta={`${item.student?.fullName ?? "Sin estudiante"} · ${item.student?.email ?? "Sin correo"} · ${item.contact?.value ?? "Sin contacto"}`}
                  body={item.note || "Sin nota adicional del estudiante."}
                >
                  <SecondaryButton onClick={() => startEditCourseInterest(item)} type="button">
                    Gestionar solicitud
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="Sin solicitudes por ahora" body="Cuando un estudiante pida apertura de un curso, lo veras aqui con sus datos de contacto." />
            )}
          </div>
        </ScrollArea>
      </SectionCard>
    </div>
  );
}
