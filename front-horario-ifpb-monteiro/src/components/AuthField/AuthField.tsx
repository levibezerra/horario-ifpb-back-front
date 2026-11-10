import type { InputHTMLAttributes, ReactNode } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: AdminIconName
  error?: string
  action?: ReactNode
}

export function AuthField({ label, icon, error, action, ...props }: AuthFieldProps) {
  return (
    <label className={error ? "admin-field has-error" : "admin-field"}>
      <span>{label}</span>
      <span className="admin-input">
        <AdminIcon name={icon} size={18} />
        <input {...props} />
        {action}
      </span>
      {error && <small>{error}</small>}
    </label>
  )
}

type PasswordToggleProps = {
  visible: boolean
  onToggle: () => void
  showLabel: string
  hideLabel: string
}

export function PasswordToggle({
  visible,
  onToggle,
  showLabel,
  hideLabel,
}: PasswordToggleProps) {
  return (
    <button
      type="button"
      className="password-toggle"
      onClick={onToggle}
      aria-label={visible ? hideLabel : showLabel}
    >
      <AdminIcon name={visible ? "eyeOff" : "eye"} size={18} />
    </button>
  )
}
