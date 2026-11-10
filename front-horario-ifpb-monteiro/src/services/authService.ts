export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function extractUsername(email: string): string {
  return email.split("@")[0] || "Administrador"
}