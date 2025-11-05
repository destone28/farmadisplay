import { useAuthStore } from '@/stores/authStore'

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchCurrentUser,
    clearError,
  } = useAuthStore()

  const isAdmin = user?.role === 'admin'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    login,
    logout,
    fetchCurrentUser,
    clearError,
  }
}
