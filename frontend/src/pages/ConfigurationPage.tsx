import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Pharmacy } from '@/types'
import { Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const configSchema = z.object({
  pharmacy_id: z.string().min(1, 'Seleziona una farmacia'),
  wifi_ssid: z.string().min(1, 'Inserisci SSID WiFi').max(100),
  wifi_password: z.string().min(8, 'Password WiFi deve essere almeno 8 caratteri').max(100),
})

type ConfigFormData = z.infer<typeof configSchema>

export default function ConfigurationPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  })

  const pharmacyId = watch('pharmacy_id')

  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await api.get<{ items: Pharmacy[] }>('/pharmacies/', {
          params: { skip: 0, limit: 100 },
        })
        setPharmacies(response.data.items)

        // Auto-select if only one pharmacy
        if (response.data.items.length === 1) {
          const pharmacy = response.data.items[0]
          setValue('pharmacy_id', pharmacy.id)
          setSelectedPharmacy(pharmacy)
          if (pharmacy.wifi_ssid) {
            setValue('wifi_ssid', pharmacy.wifi_ssid)
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPharmacies()
  }, [setValue])

  // Update selected pharmacy and pre-fill SSID
  useEffect(() => {
    if (pharmacyId) {
      const pharmacy = pharmacies.find((p) => p.id === pharmacyId)
      setSelectedPharmacy(pharmacy || null)
      if (pharmacy?.wifi_ssid) {
        setValue('wifi_ssid', pharmacy.wifi_ssid)
      }
    }
  }, [pharmacyId, pharmacies, setValue])

  const onSubmit = async (data: ConfigFormData) => {
    if (!selectedPharmacy) return

    setDownloading(true)
    try {
      // First, update the pharmacy with wifi_ssid
      await api.put(`/pharmacies/${data.pharmacy_id}`, {
        wifi_ssid: data.wifi_ssid,
      })

      // Generate configuration JSON
      const response = await api.post(
        `/pharmacies/${data.pharmacy_id}/generate-config`,
        {
          pharmacy_id: data.pharmacy_id,
          wifi_password: data.wifi_password,
        }
      )

      // Download as JSON file
      const configJson = response.data
      const blob = new Blob([JSON.stringify(configJson, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `configurazione_farmacia_${selectedPharmacy.name.replace(/\s+/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Configurazione scaricata con successo!')
    } catch (error: any) {
      console.error('Error generating configuration:', error)
      const errorMessage =
        error.response?.data?.detail || 'Errore durante la generazione della configurazione'
      alert(errorMessage)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nessuna farmacia disponibile
          </h2>
          <p className="text-gray-600">
            Crea una farmacia prima di generare la configurazione
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Configurazione Raspberry Pi
        </h1>
        <p className="text-gray-600">
          Configura e scarica il file di configurazione per il display della farmacia
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacy_id">
              Farmacia <span className="text-destructive">*</span>
            </Label>
            <select
              id="pharmacy_id"
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              {...register('pharmacy_id')}
              disabled={pharmacies.length === 1}
            >
              <option value="">Seleziona una farmacia</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name} - ID Display: {pharmacy.display_id}
                </option>
              ))}
            </select>
            {errors.pharmacy_id && (
              <p className="text-sm text-destructive">{errors.pharmacy_id.message}</p>
            )}
          </div>

          {selectedPharmacy && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Farmacia selezionata</p>
                  <p className="text-blue-700">
                    <strong>Nome:</strong> {selectedPharmacy.name}
                  </p>
                  <p className="text-blue-700">
                    <strong>ID Display:</strong>{' '}
                    <code className="bg-blue-100 px-2 py-0.5 rounded">
                      {selectedPharmacy.display_id}
                    </code>
                  </p>
                  <p className="text-blue-700 mt-1">
                    <strong>URL Display:</strong>{' '}
                    <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">
                      http://localhost:5173/display/{selectedPharmacy.display_id}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wifi_ssid">
              SSID WiFi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wifi_ssid"
              type="text"
              placeholder="Nome rete WiFi"
              {...register('wifi_ssid')}
            />
            {errors.wifi_ssid && (
              <p className="text-sm text-destructive">{errors.wifi_ssid.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Il nome della rete WiFi a cui il Raspberry Pi si connetterà
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wifi_password">
              Password WiFi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wifi_password"
              type="password"
              placeholder="Password WiFi (minimo 8 caratteri)"
              {...register('wifi_password')}
            />
            {errors.wifi_password && (
              <p className="text-sm text-destructive">{errors.wifi_password.message}</p>
            )}
            <p className="text-xs text-gray-500">
              La password non verrà salvata, sarà inclusa solo nel file scaricato
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={downloading || !selectedPharmacy}
            className="w-full sm:w-auto"
          >
            {downloading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generazione...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Scarica Configurazione
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informazioni</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Il file JSON conterrà tutte le informazioni necessarie per configurare il display</li>
          <li>L'SSID WiFi viene salvato per facilitare future configurazioni</li>
          <li>La password WiFi non viene mai salvata nel database per motivi di sicurezza</li>
          <li>
            Trasferisci il file JSON generato sul Raspberry Pi per configurare automaticamente il
            display
          </li>
        </ul>
      </div>
    </div>
  )
}
