import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Device, DeviceCreate, DeviceActivate, DeviceStatus } from '@/types'

interface DevicesParams {
  pharmacy_id?: string
  status?: DeviceStatus
}

export function useDevices(params: DevicesParams = {}) {
  return useQuery({
    queryKey: ['devices', params],
    queryFn: async () => {
      const { data } = await api.get<Device[]>('/devices', { params })
      return data
    },
  })
}

export function useDevice(id: string | undefined) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: async () => {
      if (!id) throw new Error('Device ID is required')
      const { data } = await api.get<Device>(`/devices/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (device: DeviceCreate) => {
      const { data } = await api.post<Device>('/devices', device)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useActivateDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: activateData }: { id: string; data: DeviceActivate }) => {
      const { data } = await api.post<Device>(`/devices/${id}/activate`, activateData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['device', data.id] })
    },
  })
}

export function useUpdateDeviceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeviceStatus }) => {
      const { data } = await api.put<Device>(`/devices/${id}/status`, { status })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      queryClient.invalidateQueries({ queryKey: ['device', data.id] })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}
