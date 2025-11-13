import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User, UserCreate, UserUpdate, PaginatedResponse } from '@/types'

interface UsersParams {
  skip?: number
  limit?: number
  search?: string
  role?: 'admin' | 'user'
}

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
      return data
    },
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required')
      const { data } = await api.get<User>(`/users/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (user: UserCreate) => {
      const { data } = await api.post<User>('/users', user)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: UserUpdate }) => {
      const { data } = await api.put<User>(`/users/${id}`, updateData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', data.id] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
