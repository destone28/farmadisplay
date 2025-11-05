import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Pharmacy, PharmacyCreate, PharmacyUpdate, PaginatedResponse } from '@/types'

interface PharmaciesParams {
  skip?: number
  limit?: number
  search?: string
}

export function usePharmacies(params: PharmaciesParams = {}) {
  return useQuery({
    queryKey: ['pharmacies', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Pharmacy>>('/pharmacies', { params })
      return data
    },
  })
}

export function usePharmacy(id: string | undefined) {
  return useQuery({
    queryKey: ['pharmacy', id],
    queryFn: async () => {
      if (!id) throw new Error('Pharmacy ID is required')
      const { data } = await api.get<Pharmacy>(`/pharmacies/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePharmacy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pharmacy: PharmacyCreate) => {
      const { data } = await api.post<Pharmacy>('/pharmacies', pharmacy)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] })
    },
  })
}

export function useUpdatePharmacy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: PharmacyUpdate }) => {
      const { data } = await api.put<Pharmacy>(`/pharmacies/${id}`, updateData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] })
      queryClient.invalidateQueries({ queryKey: ['pharmacy', data.id] })
    },
  })
}

export function useDeletePharmacy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pharmacies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] })
    },
  })
}
