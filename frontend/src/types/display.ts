export enum DisplayMode {
  IMAGE = 'image',
  SCRAPED = 'scraped',
  MANUAL = 'manual'
}

export interface DisplayConfig {
  id: number;
  pharmacy_id: string;

  // Header
  logo_path: string | null;
  pharmacy_name: string;
  pharmacy_hours: string | null;

  // Display mode
  display_mode: DisplayMode;

  // Image mode
  image_path: string | null;

  // Scraped mode
  scraping_cap: string | null;
  scraping_city: string | null;
  scraping_province: string | null;

  // Footer
  footer_text: string | null;

  // Styling
  background_color: string;
  text_color: string;
}

export interface DisplayConfigCreate {
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_hours?: string;
  display_mode?: DisplayMode;
  footer_text?: string;
  background_color?: string;
  text_color?: string;
}

export interface DisplayConfigUpdate {
  pharmacy_name?: string;
  pharmacy_hours?: string;
  display_mode?: DisplayMode;
  scraping_cap?: string;
  scraping_city?: string;
  scraping_province?: string;
  footer_text?: string;
  background_color?: string;
  text_color?: string;
}
