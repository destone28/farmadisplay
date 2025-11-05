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
import { useCreateDevice } from '@/hooks/useDevices'
import type { DeviceCreate } from '@/types'

const deviceSchema = z.object({
  serial_number: z.string().min(1, 'Serial number richiesto'),
  mac_address: z.string().optional(),
  firmware_version: z.string().optional(),
})

interface DeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeviceDialog({ open, onOpenChange }: DeviceDialogProps) {
  const createDevice = useCreateDevice()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceCreate>({
    resolver: zodResolver(deviceSchema),
  })

  const onSubmit = async (data: DeviceCreate) => {
    try {
      await createDevice.mutateAsync(data)
      onOpenChange(false)
      reset()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Errore durante la registrazione')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registra Nuovo Dispositivo</DialogTitle>
          <DialogDescription>
            Registra un nuovo dispositivo Raspberry Pi nel sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">
              Serial Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serial_number"
              placeholder="RPI-001"
              {...register('serial_number')}
            />
            {errors.serial_number && (
              <p className="text-sm text-destructive">{errors.serial_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mac_address">MAC Address</Label>
            <Input
              id="mac_address"
              placeholder="AA:BB:CC:DD:EE:FF"
              {...register('mac_address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firmware_version">Versione Firmware</Label>
            <Input
              id="firmware_version"
              placeholder="1.0.0"
              {...register('firmware_version')}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Nota</p>
            <p className="text-muted-foreground">
              Dopo la registrazione, verrà generato un codice di attivazione univoco
              da utilizzare per associare il dispositivo a una farmacia.
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
                  Registrazione...
                </>
              ) : (
                'Registra Dispositivo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
