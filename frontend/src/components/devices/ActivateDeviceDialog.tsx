import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActivateDevice } from '@/hooks/useDevices'
import { usePharmacies } from '@/hooks/usePharmacies'
import type { Device, DeviceActivate } from '@/types'

const activateSchema = z.object({
  activation_code: z.string().min(1, 'Codice richiesto'),
  pharmacy_id: z.string().min(1, 'Farmacia richiesta'),
})

interface ActivateDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
}

export default function ActivateDeviceDialog({
  open,
  onOpenChange,
  device,
}: ActivateDeviceDialogProps) {
  const activateDevice = useActivateDevice()
  const { data: pharmaciesData } = usePharmacies({ limit: 100 })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeviceActivate>({
    resolver: zodResolver(activateSchema),
  })

  useEffect(() => {
    if (open && device) {
      setValue('activation_code', device.activation_code)
    }
  }, [open, device, setValue])

  const onSubmit = async (data: DeviceActivate) => {
    if (!device) return

    try {
      await activateDevice.mutateAsync({ id: device.id, data })
      onOpenChange(false)
      reset()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Errore durante l\'attivazione')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Attiva Dispositivo</DialogTitle>
          <DialogDescription>
            Associa il dispositivo a una farmacia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {device && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Dispositivo</p>
              <p className="text-muted-foreground">
                Serial: <span className="font-mono">{device.serial_number}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="activation_code">
              Codice di Attivazione <span className="text-destructive">*</span>
            </Label>
            <Input
              id="activation_code"
              placeholder="ABCD1234EFGH5678IJKL"
              {...register('activation_code')}
              disabled
            />
            {errors.activation_code && (
              <p className="text-sm text-destructive">{errors.activation_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pharmacy_id">
              Farmacia <span className="text-destructive">*</span>
            </Label>
            <select
              id="pharmacy_id"
              {...register('pharmacy_id')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Seleziona una farmacia --</option>
              {pharmaciesData?.items.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name} - {pharmacy.city || 'N/A'}
                </option>
              ))}
            </select>
            {errors.pharmacy_id && (
              <p className="text-sm text-destructive">{errors.pharmacy_id.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Nota</p>
            <p className="text-muted-foreground">
              Una volta attivato, il dispositivo sarà associato alla farmacia selezionata
              e potrà visualizzare i turni programmati.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Attivazione...
                </>
              ) : (
                'Attiva Dispositivo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
