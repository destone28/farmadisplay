import { useState } from 'react'
import { Plus, Monitor, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDevices, useDeleteDevice } from '@/hooks/useDevices'
import { useAuth } from '@/hooks/useAuth'
import DeviceDialog from '@/components/devices/DeviceDialog'
import ActivateDeviceDialog from '@/components/devices/ActivateDeviceDialog'
import type { Device } from '@/types'

export default function DevicesPage() {
  const { isAdmin } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>()
  const { data: devices, isLoading } = useDevices()
  const deleteDevice = useDeleteDevice()

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Attivo',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-700',
        }
      case 'pending':
        return {
          label: 'In attesa',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-700',
        }
      case 'inactive':
        return {
          label: 'Inattivo',
          icon: AlertCircle,
          className: 'bg-gray-100 text-gray-700',
        }
      case 'maintenance':
        return {
          label: 'Manutenzione',
          icon: Wrench,
          className: 'bg-orange-100 text-orange-700',
        }
      default:
        return {
          label: status,
          icon: Monitor,
          className: 'bg-gray-100 text-gray-700',
        }
    }
  }

  const handleActivate = (device: Device) => {
    setSelectedDevice(device)
    setIsActivateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Solo gli amministratori possono eliminare dispositivi')
      return
    }
    if (window.confirm('Sei sicuro di voler eliminare questo dispositivo?')) {
      try {
        await deleteDevice.mutateAsync(id)
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Errore durante l\'eliminazione')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispositivi</h1>
          <p className="text-muted-foreground">
            Gestisci i dispositivi Raspberry Pi
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registra Dispositivo
          </Button>
        )}
      </div>

      {!devices || devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun dispositivo</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {isAdmin
                ? 'Inizia registrando il primo dispositivo'
                : 'Nessun dispositivo disponibile'}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registra Dispositivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const statusInfo = getStatusInfo(device.status)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        {device.serial_number}
                      </CardTitle>
                      <CardDescription>
                        {device.mac_address || 'MAC non specificato'}
                      </CardDescription>
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {device.status === 'pending' && (
                      <div className="rounded-lg bg-muted p-3">
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          Codice di Attivazione
                        </p>
                        <code className="text-sm font-mono">
                          {device.activation_code}
                        </code>
                      </div>
                    )}
                    {device.firmware_version && (
                      <p className="text-muted-foreground">
                        Firmware: <span className="font-medium">{device.firmware_version}</span>
                      </p>
                    )}
                    {device.last_seen && (
                      <p className="text-muted-foreground">
                        Ultimo accesso:{' '}
                        <span className="font-medium">
                          {new Date(device.last_seen).toLocaleString('it-IT')}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {device.status === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivate(device)}
                      >
                        Attiva
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(device.id)}
                        disabled={deleteDevice.isPending}
                      >
                        Elimina
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <DeviceDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      )}

      <ActivateDeviceDialog
        open={isActivateOpen}
        onOpenChange={setIsActivateOpen}
        device={selectedDevice}
      />
    </div>
  )
}
