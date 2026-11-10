import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react"

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  text?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  icon?: ReactNode
  loading?: boolean
}

export default function Button({
  text,
  children,
  onClick,
  className = "",
  icon,
  loading = false,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`btn ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {icon}
      {loading ? "Aguarde..." : (children ?? text)}
    </button>
  )
}