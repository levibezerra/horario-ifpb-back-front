import type { ReactNode } from "react"

export type AdminIconName =
  | "home"
  | "classes"
  | "subjects"
  | "teachers"
  | "rooms"
  | "schedules"
  | "search"
  | "plus"
  | "edit"
  | "trash"
  | "logout"
  | "arrow"
  | "mail"
  | "lock"
  | "eye"
  | "eyeOff"
  | "check"
  | "warning"
  | "close"
  | "menu"

export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
  const paths: Record<AdminIconName, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    classes: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2 20a6 6 0 0 1 12 0M14 16a5 5 0 0 1 8 4" />
      </>
    ),
    subjects: (
      <>
        <path d="M4 19a2 2 0 0 1 2-2h14V4H6a2 2 0 0 0-2 2Z" />
        <path d="M4 6v13a2 2 0 0 0 2 2h14" />
      </>
    ),
    teachers: (
      <>
        <circle cx="8" cy="8" r="3" />
        <path d="M2 20a6 6 0 0 1 12 0M15 4h7v12h-5M18 8h2M18 11h2" />
      </>
    ),
    rooms: (
      <>
        <path d="M4 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M2 21h20" />
        <path d="M8 7h2M8 11h2M14 7h1M14 11h1M8 15h2" />
      </>
    ),
    schedules: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="m4 20 4-1 11-11-3-3L5 16Z" />
        <path d="m14 7 3 3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    arrow: <path d="m15 18-6-6 6-6" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18M10.5 6.2A10 10 0 0 1 12 6c6 0 10 6 10 6a16 16 0 0 1-2 2.7M6.3 6.3C3.6 8.2 2 12 2 12s4 6 10 6a9 9 0 0 0 3-.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    warning: (
      <>
        <path d="M12 3 2 21h20Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
