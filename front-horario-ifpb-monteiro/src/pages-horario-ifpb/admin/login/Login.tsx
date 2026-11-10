import { useState, type FormEvent } from "react"
import { AuthField, PasswordToggle } from "@/components/AuthField"
import { useAuth } from "@/hooks/useAuth"
import { Link, useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import { EMAIL_PATTERN } from "@/services/authService"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./login.css"
import { toast } from "react-toastify"

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: "email" | "password", value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: "" }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.email.trim()) next.email = "Informe o e-mail."
    else if (!EMAIL_PATTERN.test(form.email))
      next.email = "Informe um e-mail válido."
    if (!form.password) next.password = "Informe a senha."
    setErrors(next)
    return !Object.keys(next).length
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) {
      toast.error("Verifique o e-mail e a senha.")
      return
    }

    try {
      setLoading(true)
      const response = await api.post(API_ENDPOINTS.login, {
        email: form.email.trim(),
        senha: form.password,
      })

      const { token, accessToken, nome, email, administrador } = response.data

      const jwtToken = token || accessToken
      const adminName = nome || administrador?.nome || form.email.split("@")[0]
      const adminEmail = email || administrador?.email || form.email.trim()

      signIn(adminName, adminEmail, jwtToken)

      toast.success("Acesso realizado com sucesso!")
      navigate(ROUTES.adminDashboard)
    } catch (err: any) {
      const msg = err.response?.data?.message || "Credenciais inválidas ou erro no servidor."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-header">
        <span>ACESSO AO SISTEMA</span>
        <h2>Área Administrativa</h2>
        <p>Entre com suas credenciais institucionais.</p>
      </div>

      <AuthField
        label="E-mail"
        icon="mail"
        type="email"
        value={form.email}
        onChange={(event) => update("email", event.target.value)}
        placeholder="nome@ifpb.edu.br"
        error={errors.email}
      />

      <AuthField
        label="Senha"
        icon="lock"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(event) => update("password", event.target.value)}
        placeholder="Digite sua senha"
        error={errors.password}
        action={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            showLabel="Visualizar senha"
            hideLabel="Ocultar senha"
          />
        }
      />

      <button className="admin-primary auth-submit" type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <div className="auth-footer">
        <span>Ainda não possui uma conta?</span>
        <Link to={ROUTES.adminRegister} className="auth-switch-link">
          Cadastre-se
        </Link>
      </div>
    </form>
  )
}