import { useState, type FormEvent } from "react"
import { AuthField, PasswordToggle } from "@/components/AuthField"
import { AdminIcon } from "@/components/Icon"
import { EMAIL_PATTERN } from "@/services/authService"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"

type AdminProfileModalProps = {
  name: string
  email: string
  onClose: () => void
  onSave: (profile: { name: string; email: string; password?: string }) => void
}

export function AdminProfileModal({
  name,
  email,
  onClose,
  onSave,
}: AdminProfileModalProps) {
  const [form, setForm] = useState({ name, email, password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = "Informe o nome."
    if (!form.email.trim()) next.email = "Informe o e-mail."
    else if (!EMAIL_PATTERN.test(form.email)) next.email = "Informe um e-mail válido."
    if (form.password && form.password.length < 6)
      next.password = "A nova senha deve ter pelo menos 6 caracteres."
    
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error("Verifique os dados do perfil.")
      return
    }

    try {
      setLoading(true)
      await api.put(API_ENDPOINTS.meuPerfil, {
        nome: form.name.trim(),
        email: form.email.trim(),
        novaSenha: form.password || undefined,
      })

      onSave({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
      })
      toast.success("Perfil atualizado com sucesso!")
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao atualizar perfil no servidor."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-modal-layer" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button className="admin-modal-backdrop" onClick={onClose} aria-label="Fechar edição do perfil"/>
      <form className="admin-modal profile-form" onSubmit={submit} noValidate>
        <div className="admin-modal-heading">
          <div><span>CONTA DO ADMINISTRADOR</span><h2 id="profile-title">Editar perfil</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar"><AdminIcon name="close" size={19}/></button>
        </div>
        <p className="profile-security-note">Atualize seus dados de acesso. A senha atual nunca é exibida.</p>
        <AuthField label="Nome" icon="teachers" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do administrador" error={errors.name}/>
        <AuthField label="E-mail" icon="mail" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nome@ifpb.edu.br" error={errors.email}/>
        <AuthField label="Nova senha" icon="lock" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Deixe em branco para manter a senha" error={errors.password} action={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((current) => !current)} showLabel="Visualizar nova senha" hideLabel="Ocultar nova senha"/>}/>
        <div className="admin-modal-actions">
          <Button text="Cancelar" onClick={onClose} disabled={loading} />
          <Button className="admin-primary" type="submit" text="Salvar alterações" loading={loading} />
        </div>
      </form>
    </div>
  )
}