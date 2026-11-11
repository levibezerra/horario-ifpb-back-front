import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type AuthContextValue = {
  adminName: string | null
  adminEmail: string
  token: string | null
  isAuthenticated: boolean
  signIn: (name: string, email: string, token: string) => void
  signOut: () => void
  updateProfile: (profile: { name: string; email: string }) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = "ifpb_access_token"
const PROFILE_KEY = "ifpb_admin_profile"

type AdminProfile = {
  name: string | null
  email: string
}

function loadStoredProfile(): AdminProfile {
  try {
    const stored = window.sessionStorage.getItem(PROFILE_KEY)
    if (stored) return JSON.parse(stored) as AdminProfile
  } catch {
    // Falha silenciosa caso o sessionStorage esteja desabilitado
  }
  return { name: null, email: "" }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile>(loadStoredProfile)
  const [token, setToken] = useState<string | null>(() =>
    window.sessionStorage.getItem(TOKEN_KEY),
  )

  const signIn = useCallback((name: string, email: string, accessToken: string) => {
    const newProfile = { name, email }
    setProfile(newProfile)
    setToken(accessToken)
    window.sessionStorage.setItem(TOKEN_KEY, accessToken)
    window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile))
  }, [])

  const signOut = useCallback(() => {
    setProfile({ name: null, email: "" })
    setToken(null)
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(PROFILE_KEY)
  }, [])

  const updateProfile = useCallback(
    ({ name, email }: { name: string; email: string }) => {
      setProfile({ name, email })
      window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify({ name, email }))
    },
    [],
  )

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      signOut()
    }
  }, [signOut])

  const value = useMemo(
    () => ({
      adminName: profile.name,
      adminEmail: profile.email,
      token,
      isAuthenticated: Boolean(token && profile.name),
      signIn,
      signOut,
      updateProfile,
    }),
    [profile, token, signIn, signOut, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth deve ser utilizado dentro de <AuthProvider>.")
  return context
}