import type { InputHTMLAttributes } from "react"

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
  className?: string
  error?: string
}

export default function InputField({
  label,
  name,
  className = "",
  error,
  required,
  ...props
}: InputFieldProps) {
  return (
    <label className={`textfield ${error ? "has-error" : ""} ${className}`.trim()}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        {...props}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
      />
      {error && <small role="alert">{error}</small>}
    </label>
  )
}