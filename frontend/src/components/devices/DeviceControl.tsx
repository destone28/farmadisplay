import React, { useState, useEffect } from 'react';
import { Device } from '../../types';
import { deviceService } from '../../services/deviceService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Power,
  Activity,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  RefreshCw,
  Terminal,
  AlertCircle
} from 'lucide-react';

interface DeviceControlProps {
  pharmacyId: string;
}

export const DeviceControl: React.FC<DeviceControlProps> = ({ pharmacyId }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebooting, setRebooting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      const deviceData = await deviceService.getDeviceForPharmacy(pharmacyId);
      setDevice(deviceData);
    } catch (err: any) {
      console.error('Error loading device:', err);
      setError(err.response?.data?.detail || 'Errore nel caricamento del dispositivo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevice();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDevice, 30000);
    return () => clearInterval(interval);
  }, [pharmacyId]);

  const handleReboot = async () => {
    if (!device) return;

    if (!confirm('Sei sicuro di voler riavviare il dispositivo?')) {
      return;
    }

    try {
      setRebooting(true);
      await deviceService.rebootDevice(device.id);
      alert('Comando di riavvio inviato con successo');

      // Refresh device status after 5 seconds
      setTimeout(loadDevice, 5000);
    } catch (err: any) {
      console.error('Error rebooting device:', err);
      alert(err.response?.data?.detail || 'Errore durante il riavvio');
    } finally {
      setRebooting(false);
    }
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}g ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusBadge = (device: Device) => {
    const isOnline = device.is_online || false;

    if (isOnline) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="w-4 h-4" />
          <span className="font-semibold">Online</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <WifiOff className="w-4 h-4" />
          <span className="font-semibold">Offline</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Caricamento...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Attenzione</h3>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!device) {
    return (
      <Card className="p-6 border-gray-200 bg-gray-50">
        <div className="flex items-start gap-3">
          <Terminal className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-700">Nessun dispositivo associato</h3>
            <p className="text-sm text-gray-600 mt-1">
              Non è ancora stato associato un dispositivo Raspberry Pi a questa bacheca.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isOnline = device.is_online || false;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Dispositivo Raspberry Pi
            </h3>
            <p className="text-sm text-gray-500">
              {device.serial_number}
            </p>
          </div>
          {getStatusBadge(device)}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          {/* IP Address */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Indirizzo IP</span>
            </div>
            <p className="text-sm font-mono text-gray-900">
              {device.ip_address || 'N/A'}
            </p>
          </div>

          {/* Uptime */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Uptime</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatUptime(device.uptime_seconds)}
            </p>
          </div>

          {/* Firmware */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-medium">Firmware</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {device.firmware_version || 'N/A'}
            </p>
          </div>

          {/* Last Heartbeat */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Ultimo contatto</span>
            </div>
            <p className="text-sm text-gray-900">
              {device.last_heartbeat
                ? new Date(device.last_heartbeat).toLocaleTimeString('it-IT')
                : 'Mai'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        {isOnline && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-medium">CPU</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {device.cpu_usage?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${device.cpu_usage || 0}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">RAM</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {device.memory_usage?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${device.memory_usage || 0}%` }}
                />
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-xs font-medium">Disco</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {device.disk_usage?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${device.disk_usage || 0}%` }}
                />
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs font-medium">Temp</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {device.temperature?.toFixed(1) || 'N/A'}°C
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (device.temperature || 0) > 70 ? 'bg-red-600' :
                    (device.temperature || 0) > 60 ? 'bg-orange-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((device.temperature || 0) / 80 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDevice}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReboot}
            disabled={!isOnline || rebooting}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Power className={`w-4 h-4 mr-2 ${rebooting ? 'animate-pulse' : ''}`} />
            {rebooting ? 'Riavvio...' : 'Riavvia'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
