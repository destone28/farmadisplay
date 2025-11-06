import { useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it.js'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePharmacies } from '@/hooks/usePharmacies'
import { useShifts, useDeleteShift } from '@/hooks/useShifts'
import ShiftDialog from '@/components/shifts/ShiftDialog'
import type { Shift } from '@/types'

export default function ShiftsPage() {
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedShift, setSelectedShift] = useState<Shift | undefined>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: pharmaciesData } = usePharmacies({ limit: 100 })
  const { data: shifts } = useShifts({
    pharmacy_id: selectedPharmacy,
    start_date: selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : undefined,
    end_date: selectedDate ? new Date(new Date(selectedDate).setMonth(new Date(selectedDate).getMonth() + 1)).toISOString().split('T')[0] : undefined,
  })
  const deleteShift = useDeleteShift()

  const events = useMemo(() => {
    if (!shifts) return []
    return shifts.map((shift) => ({
      id: shift.id,
      title: `${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`,
      start: `${shift.date}T${shift.start_time}`,
      end: `${shift.date}T${shift.end_time}`,
      extendedProps: shift,
    }))
  }, [shifts])

  const handleDateSelect = (selectInfo: any) => {
    if (!selectedPharmacy) {
      alert('Seleziona prima una farmacia')
      return
    }
    setSelectedDate(selectInfo.startStr)
    setSelectedShift(undefined)
    setIsDialogOpen(true)
  }

  const handleEventClick = (clickInfo: any) => {
    setSelectedShift(clickInfo.event.extendedProps as Shift)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo turno?')) {
      try {
        await deleteShift.mutateAsync(id)
        setIsDialogOpen(false)
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Errore durante l\'eliminazione')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestione Turni</h1>
        <p className="text-muted-foreground">
          Programma e gestisci i turni delle farmacie
        </p>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Seleziona Farmacia
          </label>
          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">-- Seleziona una farmacia --</option>
            {pharmaciesData?.items.map((pharmacy) => (
              <option key={pharmacy.id} value={pharmacy.id}>
                {pharmacy.name} - {pharmacy.city || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        {selectedPharmacy ? (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            initialView="dayGridMonth"
            locale={itLocale}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            datesSet={(dateInfo) => {
              setSelectedDate(dateInfo.startStr)
            }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Seleziona una farmacia per visualizzare i turni
          </div>
        )}
      </Card>

      <ShiftDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        shift={selectedShift}
        pharmacyId={selectedPharmacy}
        initialDate={selectedDate}
        onDelete={handleDelete}
      />
    </div>
  )
}
