import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Shift, ShiftCreate, ShiftUpdate } from '@/types'

interface ShiftsParams {
  pharmacy_id: string
  start_date?: string
  end_date?: string
}

export function useShifts(params: ShiftsParams) {
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: async () => {
      const { data } = await api.get<Shift[]>('/shifts', { params })
      return data
    },
    enabled: !!params.pharmacy_id,
  })
}

export function useShift(id: string | undefined) {
  return useQuery({
    queryKey: ['shift', id],
    queryFn: async () => {
      if (!id) throw new Error('Shift ID is required')
      const { data } = await api.get<Shift>(`/shifts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shift: ShiftCreate) => {
      const { data } = await api.post<Shift>('/shifts', shift)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: ShiftUpdate }) => {
      const { data } = await api.put<Shift>(`/shifts/${id}`, updateData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shift', data.id] })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shifts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}
