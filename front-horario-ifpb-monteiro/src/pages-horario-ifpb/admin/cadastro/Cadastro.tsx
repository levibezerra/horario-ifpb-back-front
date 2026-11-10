import { useState, type FormEvent } from "react"
import { AuthField, PasswordToggle } from "@/components/AuthField"
import { Link, useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import { EMAIL_PATTERN } from "@/services/authService"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"

export default function Cadastro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}

    if (!form.name.trim()) next.name = "Informe o nome."
    if (!form.email.trim()) next.email = "Informe o e-mail."
    else if (!EMAIL_PATTERN.test(form.email)) next.email = "Informe um e-mail válido."

    if (!form.password) next.password = "Informe a senha."
    else if (form.password.length < 6) next.password = "A senha deve ter pelo menos 6 caracteres."

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "As senhas não coincidem."
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      toast.error("Preencha os campos corretamente.")
      return
    }

    try {
      setLoading(true)

      // Chamada ajustada para a rota pública declarada no AuthController
      await api.post(`${API_ENDPOINTS.login.replace("/login", "")}/register`, {
        nome: form.name.trim(),
        email: form.email.trim(),
        senha: form.password,
      })

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      navigate(ROUTES.adminLogin)
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao realizar cadastro no servidor."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-header">
        <span>NOVO ACESSO</span>
        <h2>Criar conta de administrador</h2>
        <p>Cadastre-se para gerenciar turmas, professores, salas e horários.</p>
      </div>

      <AuthField
        label="Nome completo"
        icon="teachers"
        value={form.name}
        onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
        placeholder="Nome do administrador"
        error={errors.name}
      />

      <AuthField
        label="E-mail"
        icon="mail"
        type="email"
        value={form.email}
        onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
        placeholder="nome@ifpb.edu.br"
        error={errors.email}
      />

      <AuthField
        label="Senha"
        icon="lock"
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
        placeholder="Mínimo de 6 caracteres"
        error={errors.password}
        action={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => setShowPassword((c) => !c)}
            showLabel="Visualizar senha"
            hideLabel="Ocultar senha"
          />
        }
      />

      <AuthField
        label="Confirmar senha"
        icon="lock"
        type={showPassword ? "text" : "password"}
        value={form.confirmPassword}
        onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))}
        placeholder="Repita a senha digitada"
        error={errors.confirmPassword}
      />

      <Button
        className="admin-primary auth-submit"
        type="submit"
        text="Criar minha conta"
        loading={loading}
      />

      <div className="auth-footer">
        Já possui acesso? <Link to={ROUTES.adminLogin}>Fazer login</Link>
      </div>
    </form>
  )
}