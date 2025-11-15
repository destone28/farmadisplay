import { api } from '../lib/api';
import { Device, DeviceCommand, DeviceCommandCreate } from '../types';

export const deviceService = {
  /**
   * Get all devices (optionally filtered by pharmacy)
   */
  async getDevices(pharmacyId?: string): Promise<Device[]> {
    const params = pharmacyId ? { pharmacy_id: pharmacyId } : {};
    const response = await api.get('/devices/', { params });
    return response.data;
  },

  /**
   * Get a specific device by ID
   */
  async getDevice(deviceId: string): Promise<Device> {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  },

  /**
   * Reboot a device
   */
  async rebootDevice(deviceId: string): Promise<DeviceCommand> {
    const response = await api.post(`/devices/${deviceId}/reboot`);
    return response.data;
  },

  /**
   * Send a custom command to device
   */
  async sendCommand(deviceId: string, command: DeviceCommandCreate): Promise<DeviceCommand> {
    const response = await api.post(`/devices/${deviceId}/commands`, command);
    return response.data;
  },

  /**
   * Get command history for a device
   */
  async getCommands(deviceId: string, limit: number = 50): Promise<DeviceCommand[]> {
    const response = await api.get(`/devices/${deviceId}/commands`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get device for a specific pharmacy
   */
  async getDeviceForPharmacy(pharmacyId: string): Promise<Device | null> {
    const devices = await this.getDevices(pharmacyId);
    return devices.length > 0 ? devices[0] : null;
  }
};
