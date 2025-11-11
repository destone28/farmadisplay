export enum DisplayMode {
  IMAGE = 'image',
  SCRAPED = 'scraped',
  MANUAL = 'manual'
}

export interface PharmacyHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface DisplayConfig {
  id: number;
  pharmacy_id: string;

  // Header
  logo_path: string | null;
  pharmacy_name: string;
  pharmacy_hours: string | null; // JSON string
  subtitle_text: string;

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

  // Styling - Theme based
  theme: 'light' | 'dark';
  primary_color: string;
  secondary_color: string;

  // Backward compatibility (deprecated)
  background_color?: string;
  text_color?: string;
}

export interface DisplayConfigCreate {
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_hours?: string | null;
  subtitle_text?: string;
  display_mode?: DisplayMode;
  footer_text?: string;
  theme?: 'light' | 'dark';
  primary_color?: string;
  secondary_color?: string;
}

export interface DisplayConfigUpdate {
  pharmacy_name?: string;
  pharmacy_hours?: string | null;
  subtitle_text?: string;
  display_mode?: DisplayMode;
  scraping_cap?: string;
  scraping_city?: string;
  scraping_province?: string;
  footer_text?: string;
  theme?: 'light' | 'dark';
  primary_color?: string;
  secondary_color?: string;
}
