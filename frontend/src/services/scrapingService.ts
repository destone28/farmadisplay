import { api } from '../lib/api';

export interface PharmacyShiftInfo {
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  status: string; // "TURNO", "APERTO"
  opening_hours: string | null;
  shift_hours: string | null;
  phone: string | null;
  distance_km: number | null;
  image_url: string | null;
  details_url: string | null;
}

export interface ScrapeResponse {
  pharmacies: PharmacyShiftInfo[];
  total: number;
  search_params: {
    cap: string | null;
    city: string | null;
    date: string;
    time: string;
  };
}

class ScrapingService {
  async searchPharmacies(cap?: string, city?: string): Promise<ScrapeResponse> {
    const response = await api.post<ScrapeResponse>('/scraping/search', {
      cap,
      city,
      search_date: null, // Use current date
      search_time: null  // Use current time
    });
    return response.data;
  }
}

export const scrapingService = new ScrapingService();
