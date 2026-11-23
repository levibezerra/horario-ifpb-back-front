import { useEffect, useState, type ReactNode } from "react"
import { AdminIcon } from "@/components/Icon"
import { apiErrorMessage } from "@/services/api"

type ConfirmDeleteModalProps = {
  open: boolean
  title: string
  itemName: string
  description?: ReactNode
  confirmLabel?: string
  dependencyActionLabel?: string | ((error: string) => string | undefined)
  onDependencyAction?: (error: string) => void
  onConfirm: () => Promise<void>
  onClose: () => void
}

const FOREST_BUTTON_STYLE = {
  background: "var(--forest)",
  color: "white",
  borderColor: "var(--forest)",
  boxShadow: "0 7px 16px rgba(16, 60, 42, 0.14)",
}

export function ConfirmDeleteModal({
  open,
  title,
  itemName,
  description,
  confirmLabel = "Excluir registro",
  dependencyActionLabel,
  onDependencyAction,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setSubmitting(false)
    setError("")
  }, [open, itemName])

  if (!open) return null

  const hasError = Boolean(error)
  const isDeleteDisabled = submitting || hasError
  const resolvedDependencyLabel =
    typeof dependencyActionLabel === "function"
      ? dependencyActionLabel(error)
      : dependencyActionLabel

  async function handleConfirm() {
    if (isDeleteDisabled) return
    try {
      setSubmitting(true)
      setError("")
      await onConfirm()
      onClose()
    } catch (err: unknown) {
      setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-modal-layer" role="alertdialog" aria-modal="true">
      <button
        type="button"
        className="admin-modal-backdrop"
        onClick={submitting ? undefined : onClose}
        aria-label={hasError ? "Fechar aviso" : "Cancelar exclusão"}
      />
      <section className="admin-confirm">
        <span>
          <AdminIcon name="warning" size={24} />
        </span>
        <h2>{title}</h2>
        <p>
          {description ?? (
            <>
              O registro <strong>{itemName}</strong> será removido permanentemente.
            </>
          )}
        </p>

        {hasError && (
          <div
            className="admin-form-error"
            role="alert"
            style={{ textAlign: "left", marginTop: "12px" }}
          >
            {error}
          </div>
        )}

        <div style={{ flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            style={hasError ? FOREST_BUTTON_STYLE : undefined}
            onClick={onClose}
            disabled={submitting}
          >
            {hasError ? "Entendi" : "Cancelar"}
          </button>

          {hasError && onDependencyAction && resolvedDependencyLabel && (
            <button
              type="button"
              style={FOREST_BUTTON_STYLE}
              onClick={() => {
                const currentError = error
                onClose()
                onDependencyAction(currentError)
              }}
            >
              {resolvedDependencyLabel}
            </button>
          )}

          <button
            type="button"
            className="confirm-delete"
            onClick={handleConfirm}
            disabled={isDeleteDisabled}
            style={
              isDeleteDisabled
                ? { opacity: 0.45, cursor: "not-allowed" }
                : undefined
            }
          >
            {submitting ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}