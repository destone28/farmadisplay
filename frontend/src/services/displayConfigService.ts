import { api } from '../lib/api';
import { DisplayConfig, DisplayConfigCreate, DisplayConfigUpdate } from '../types/display';

export const displayConfigService = {
  async getConfig(pharmacyId: string): Promise<DisplayConfig> {
    const response = await api.get(`/display-config/${pharmacyId}`);
    return response.data;
  },

  async createConfig(data: DisplayConfigCreate): Promise<DisplayConfig> {
    const response = await api.post('/display-config/', data);
    return response.data;
  },

  async updateConfig(pharmacyId: string, data: DisplayConfigUpdate): Promise<DisplayConfig> {
    const response = await api.put(`/display-config/${pharmacyId}`, data);
    return response.data;
  },

  async uploadLogo(pharmacyId: string, file: File): Promise<{ logo_path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/display-config/${pharmacyId}/upload-logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  async uploadImage(pharmacyId: string, file: File): Promise<{ image_path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/display-config/${pharmacyId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  async deleteConfig(pharmacyId: string): Promise<void> {
    await api.delete(`/display-config/${pharmacyId}`);
  }
};
