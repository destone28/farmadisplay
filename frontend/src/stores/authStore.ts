import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import type { User, LoginRequest, AuthResponse } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  updateUser: (user: User) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          // Login endpoint expects JSON
          const { data } = await api.post<AuthResponse>('/auth/login', credentials)

          const token = data.access_token
          localStorage.setItem('auth_token', token)

          // Fetch user details
          const userResponse = await api.get<User>('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })

          set({
            user: userResponse.data,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          let errorMessage = 'Login failed'

          if (error.response?.data?.detail) {
            // Handle string detail
            if (typeof error.response.data.detail === 'string') {
              errorMessage = error.response.data.detail
            }
            // Handle array of validation errors (FastAPI 422)
            else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail
                .map((err: any) => err.msg || JSON.stringify(err))
                .join(', ')
            }
          }

          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      fetchCurrentUser: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const { data } = await api.get<User>('/auth/me')
          set({
            user: data,
            token,
            isAuthenticated: true,
          })
        } catch (error) {
          localStorage.removeItem('auth_token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
