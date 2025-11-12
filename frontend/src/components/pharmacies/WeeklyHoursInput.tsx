import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [copyMenuOpen, setCopyMenuOpen] = useState<keyof WeeklyHours | null>(null)

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

  const copyHoursFrom = (targetDay: keyof WeeklyHours, sourceDay: keyof WeeklyHours) => {
    const updated = {
      ...value,
      [targetDay]: {
        slots: value[sourceDay].slots.map(slot => ({ ...slot })),
      },
    }
    onChange(updated)
    setCopyMenuOpen(null)
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
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCopyMenuOpen(copyMenuOpen === day ? null : day)}
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copia da
                    </Button>
                    {copyMenuOpen === day && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {(Object.keys(dayNames) as Array<keyof WeeklyHours>)
                          .filter(d => d !== day)
                          .map((sourceDay) => (
                            <button
                              key={sourceDay}
                              type="button"
                              onClick={() => copyHoursFrom(day, sourceDay)}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              {dayNames[sourceDay]}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({value[sourceDay].slots.length === 0
                                  ? 'Chiuso'
                                  : `${value[sourceDay].slots.length} orari`})
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-xs text-muted-foreground">
        Configura gli orari di apertura per ogni giorno della settimana. Puoi aggiungere più fasce orarie per giorno.
      </p>
    </div>
  )
}
