const TOKEN_KEY = "ifpb_access_token"

let accessToken: string | null = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null

export const authSession = {
  getAccessToken: (): string | null => {
    if (!accessToken && typeof window !== "undefined") {
      accessToken = sessionStorage.getItem(TOKEN_KEY)
    }
    return accessToken
  },
  setAccessToken: (token: string): void => {
    accessToken = token
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  },
  clear: (): void => {
    accessToken = null
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TOKEN_KEY)
    }
  },
}