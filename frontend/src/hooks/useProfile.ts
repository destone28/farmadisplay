import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User, ProfileUpdate } from '@/types'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const { data: updatedUser } = await api.put<User>('/auth/profile', data)
      return updatedUser
    },
    onSuccess: (data) => {
      // Invalidate current user query to refresh the UI
      queryClient.setQueryData(['currentUser'], data)
      // Also invalidate any user-related queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
