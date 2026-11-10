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
    <label className={`textfield ${className}`.trim()}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input {...props} name={name} required={required} />
      {error && <small>{error}</small>}
    </label>
  )
}
