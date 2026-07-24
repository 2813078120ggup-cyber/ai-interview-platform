import { computed, ref } from 'vue'

export interface UserProfile {
  id?: string | number
  username?: string
  realName?: string
  roles?: string[]
}

export interface LoginSession {
  token: string
  refreshToken?: string
  user: UserProfile
}

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const PROFILE_KEY = 'profile'

function readProfile(): UserProfile {
  try {
    const value = localStorage.getItem(PROFILE_KEY)
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}

export const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) ?? '')
export const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) ?? '')
export const profile = ref<UserProfile>(readProfile())
export const isAuthenticated = computed(() => Boolean(accessToken.value))
export const isAdmin = computed(() => profile.value.roles?.includes('ADMIN') ?? false)

/** Replaces all browser-side credentials and profile data as one atomic session update. */
export function establishSession(session: LoginSession) {
  clearSession()
  accessToken.value = session.token
  refreshToken.value = session.refreshToken ?? ''
  profile.value = session.user ?? {}
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value)
  if (refreshToken.value) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value))
}

/** Clears only authentication data; unrelated browser preferences are preserved. */
export function clearSession() {
  accessToken.value = ''
  refreshToken.value = ''
  profile.value = {}
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(PROFILE_KEY)
}

window.addEventListener('storage', (event) => {
  if ([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PROFILE_KEY].includes(event.key ?? '')) {
    accessToken.value = localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''
    refreshToken.value = localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
    profile.value = readProfile()
  }
})
