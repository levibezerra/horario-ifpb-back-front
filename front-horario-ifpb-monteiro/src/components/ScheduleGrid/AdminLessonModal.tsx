import { useState } from "react"
import { AdminIcon, Icon } from "@/components/Icon"
import type { ScheduleLesson } from "@/types/api"

type AdminLessonModalProps = {
  lesson: ScheduleLesson
  onClose: () => void
  onEdit: (lessonId: string) => void
  onDelete: (lessonId: string) => Promise<void> | void
}

export function AdminLessonModal({
  lesson,
  onClose,
  onEdit,
  onDelete,
}: AdminLessonModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!lesson.id) return
    try {
      setDeleting(true)
      await onDelete(lesson.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="admin-lesson-title">
      <button className="modal-overlay" onClick={onClose} aria-label="Fechar detalhes" />
      <section className="lesson-modal">
        <div className="modal-top">
          <span><Icon name="book" /></span>
          <button onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
        </div>
        <p>GERENCIAR BLOCO DE AULA</p>
        <h2 id="admin-lesson-title">{lesson.subject}</h2>

        <div className="details">
          <div>
            <Icon name="teacher" />
            <span>
              <small>Professor</small>
              <strong>{lesson.teacher}</strong>
            </span>
          </div>
          <div>
            <Icon name="users" />
            <span>
              <small>Turma</small>
              <strong>{lesson.className}</strong>
            </span>
          </div>
          <div>
            <Icon name="room" />
            <span>
              <small>Ambiente</small>
              <strong>{lesson.room || "Não informado"}</strong>
            </span>
          </div>
          <div>
            <Icon name="clock" />
            <span>
              <small>Dia e Horário</small>
              <strong>
                {lesson.day} · {lesson.start.substring(0, 5)}–{lesson.end.substring(0, 5)}
              </strong>
            </span>
          </div>
        </div>

        {!confirmingDelete ? (
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="modal-action"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                if (lesson.id) {
                  onClose()
                  onEdit(lesson.id)
                }
              }}
            >
              <AdminIcon name="edit" size={17} />
              Editar Bloco
            </button>

            <button
              type="button"
              className="modal-action"
              style={{
                flex: 1,
                justifyContent: "center",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                borderColor: "#dc2626",
              }}
              onClick={() => setConfirmingDelete(true)}
            >
              <AdminIcon name="trash" size={17} />
              Excluir
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.875rem",
              borderRadius: "10px",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
            }}
          >
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#991b1b", textTransform: "none", letterSpacing: "normal" }}>
              Tem certeza que deseja excluir o bloco de <strong>{lesson.subject}</strong>?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="modal-action"
                style={{ flex: 1, justifyContent: "center", backgroundColor: "transparent", color: "inherit" }}
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-action"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}