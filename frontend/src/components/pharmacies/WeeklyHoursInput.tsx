import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Copy } from 'lucide-react'
import { useState } from 'react'

interface TimeSlot {
  open: string
  close: string
}

interface DaySchedule {
  slots: TimeSlot[]
}

export interface WeeklyHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface WeeklyHoursInputProps {
  value: WeeklyHours
  onChange: (hours: WeeklyHours) => void
}

const dayNames: Record<keyof WeeklyHours, string> = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica',
}

const defaultTimeSlot: TimeSlot = { open: '09:00', close: '18:00' }

export const getDefaultWeeklyHours = (): WeeklyHours => ({
  monday: { slots: [{ ...defaultTimeSlot }] },
  tuesday: { slots: [{ ...defaultTimeSlot }] },
  wednesday: { slots: [{ ...defaultTimeSlot }] },
  thursday: { slots: [{ ...defaultTimeSlot }] },
  friday: { slots: [{ ...defaultTimeSlot }] },
  saturday: { slots: [{ ...defaultTimeSlot }] },
  sunday: { slots: [] }, // Closed by default
})

export default function WeeklyHoursInput({ value, onChange }: WeeklyHoursInputProps) {
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [currentDay, setCurrentDay] = useState<keyof WeeklyHours | null>(null)

  const addTimeSlot = (day: keyof WeeklyHours) => {
    const updated = {
      ...value,
      [day]: {
        ...value[day],
        slots: [...value[day].slots, { ...defaultTimeSlot }],
      },
    }
    onChange(updated)
  }

  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    const updated = {
      ...value,
      [day]: {
        ...value[day],
        slots: value[day].slots.filter((_, i) => i !== index),
      },
    }
    onChange(updated)
  }

  const updateTimeSlot = (day: keyof WeeklyHours, index: number, field: 'open' | 'close', newValue: string) => {
    const updated = {
      ...value,
      [day]: {
        ...value[day],
        slots: value[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: newValue } : slot
        ),
      },
    }
    onChange(updated)
  }

  const openCopyDialog = (day: keyof WeeklyHours) => {
    setCurrentDay(day)
    setCopyDialogOpen(true)
  }

  const copyHoursFrom = (sourceDay: keyof WeeklyHours) => {
    if (!currentDay) return
    const updated = {
      ...value,
      [currentDay]: {
        slots: value[sourceDay].slots.map(slot => ({ ...slot })),
      },
    }
    onChange(updated)
    setCopyDialogOpen(false)
    setCurrentDay(null)
  }

  return (
    <div className="space-y-2">
      <Label>Orari Settimanali</Label>
      <Accordion type="multiple" defaultValue={[]} className="w-full">
        {(Object.keys(dayNames) as Array<keyof WeeklyHours>).map((day) => (
          <AccordionItem key={day} value={day}>
            <AccordionTrigger className="text-sm">
              <div className="flex items-center justify-between w-full pr-2">
                <span>{dayNames[day]}</span>
                <span className="text-xs text-muted-foreground">
                  {value[day].slots.length === 0
                    ? 'Chiuso'
                    : value[day].slots.length === 1
                    ? '1 orario'
                    : `${value[day].slots.length} orari`}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {value[day].slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun orario configurato (chiuso)</p>
                ) : (
                  value[day].slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`${day}-${index}-open`} className="text-xs">
                            Apertura
                          </Label>
                          <Input
                            id={`${day}-${index}-open`}
                            type="time"
                            value={slot.open}
                            onChange={(e) => updateTimeSlot(day, index, 'open', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${day}-${index}-close`} className="text-xs">
                            Chiusura
                          </Label>
                          <Input
                            id={`${day}-${index}-close`}
                            type="time"
                            value={slot.close}
                            onChange={(e) => updateTimeSlot(day, index, 'close', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTimeSlot(day, index)}
                        className="mt-5 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(day)}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Aggiungi Orario
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openCopyDialog(day)}
                    className="w-full"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copia da
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-xs text-muted-foreground">
        Configura gli orari di apertura per ogni giorno della settimana. Puoi aggiungere più fasce orarie per giorno.
      </p>

      {/* Copy Hours Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copia orari da un altro giorno</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {currentDay && (Object.keys(dayNames) as Array<keyof WeeklyHours>)
              .filter(d => d !== currentDay)
              .map((sourceDay) => (
                <Button
                  key={sourceDay}
                  type="button"
                  variant="outline"
                  onClick={() => copyHoursFrom(sourceDay)}
                  className="w-full justify-between"
                >
                  <span>{dayNames[sourceDay]}</span>
                  <span className="text-xs text-muted-foreground">
                    {value[sourceDay].slots.length === 0
                      ? 'Chiuso'
                      : value[sourceDay].slots.length === 1
                      ? '1 orario'
                      : `${value[sourceDay].slots.length} orari`}
                  </span>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
