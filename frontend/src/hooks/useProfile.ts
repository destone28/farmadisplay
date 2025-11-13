import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { User, ProfileUpdate, PasswordChange } from '@/types'

export function useUpdateProfile() {
  const updateUser = useAuthStore((state) => state.updateUser)

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const { data: updatedUser } = await api.put<User>('/auth/profile', data)
      return updatedUser
    },
    onSuccess: (data) => {
      // Update the auth store with the new user data
      updateUser(data)
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: PasswordChange) => {
      const { data: response } = await api.post<{ message: string }>('/auth/change-password', data)
      return response
    },
  })
}
