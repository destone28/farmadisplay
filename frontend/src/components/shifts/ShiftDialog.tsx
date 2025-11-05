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
import { useCreateShift, useUpdateShift } from '@/hooks/useShifts'
import type { Shift, ShiftCreate } from '@/types'

const shiftSchema = z.object({
  date: z.string().min(1, 'Data richiesta'),
  start_time: z.string().min(1, 'Ora inizio richiesta'),
  end_time: z.string().min(1, 'Ora fine richiesta'),
  is_recurring: z.boolean(),
  recurrence_rule: z.string().optional(),
  notes: z.string().optional(),
})

interface ShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift?: Shift
  pharmacyId: string
  initialDate?: string
  onDelete?: (id: string) => void
}

export default function ShiftDialog({
  open,
  onOpenChange,
  shift,
  pharmacyId,
  initialDate,
  onDelete,
}: ShiftDialogProps) {
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const isEditing = !!shift

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Omit<ShiftCreate, 'pharmacy_id'>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: shift
      ? {
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_recurring: shift.is_recurring,
          recurrence_rule: shift.recurrence_rule || '',
          notes: shift.notes || '',
        }
      : {
          date: initialDate ? new Date(initialDate).toISOString().split('T')[0] : '',
          start_time: '08:00',
          end_time: '20:00',
          is_recurring: false,
          recurrence_rule: '',
          notes: '',
        },
  })

  const isRecurring = watch('is_recurring')

  useEffect(() => {
    if (open) {
      if (shift) {
        reset({
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_recurring: shift.is_recurring,
          recurrence_rule: shift.recurrence_rule || '',
          notes: shift.notes || '',
        })
      } else {
        reset({
          date: initialDate ? new Date(initialDate).toISOString().split('T')[0] : '',
          start_time: '08:00',
          end_time: '20:00',
          is_recurring: false,
          recurrence_rule: '',
          notes: '',
        })
      }
    }
  }, [open, shift, initialDate, reset])

  const onSubmit = async (data: Omit<ShiftCreate, 'pharmacy_id'>) => {
    try {
      const shiftData: ShiftCreate = {
        ...data,
        pharmacy_id: pharmacyId,
        recurrence_rule: data.is_recurring ? data.recurrence_rule : undefined,
      }

      if (isEditing) {
        await updateShift.mutateAsync({ id: shift.id, data: shiftData })
      } else {
        await createShift.mutateAsync(shiftData)
      }
      onOpenChange(false)
      reset()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Errore durante il salvataggio')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Turno' : 'Nuovo Turno'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica le informazioni del turno'
              : 'Crea un nuovo turno per la farmacia selezionata'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Ora Inizio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">
                Ora Fine <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-sm text-destructive">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_recurring"
              className="h-4 w-4 rounded border-gray-300"
              {...register('is_recurring')}
            />
            <Label htmlFor="is_recurring" className="cursor-pointer">
              Turno ricorrente
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="recurrence_rule">
                Regola di ricorrenza (RRULE)
              </Label>
              <Input
                id="recurrence_rule"
                placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                {...register('recurrence_rule')}
              />
              <p className="text-xs text-muted-foreground">
                Es: FREQ=WEEKLY;BYDAY=MO,WE,FR (Lunedì, Mercoledì, Venerdì)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Input
              id="notes"
              placeholder="Note opzionali"
              {...register('notes')}
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(shift.id)}
                className="mr-auto"
              >
                Elimina
              </Button>
            )}
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
                  Salvataggio...
                </>
              ) : isEditing ? (
                'Salva Modifiche'
              ) : (
                'Crea Turno'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
