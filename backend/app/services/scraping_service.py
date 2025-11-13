"""Service for scraping pharmacy shift data from farmaciediturno.org."""

import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from datetime import datetime, date, time as dt_time
from pydantic import BaseModel
import re


class PharmacyShiftInfo(BaseModel):
    """Informazioni farmacia di turno da scraping."""
    name: str
    address: str
    city: str
    province: str
    postal_code: str
    status: str  # "TURNO", "APERTO"
    opening_hours: Optional[str] = None
    shift_hours: Optional[str] = None
    phone: Optional[str] = None
    distance_km: Optional[float] = None
    image_url: Optional[str] = None
    details_url: Optional[str] = None


class ScrapingService:
    """Service per scraping dati da farmaciediturno.org."""

    BASE_URL = "https://www.farmaciediturno.org"
    SEARCH_URL = f"{BASE_URL}/ricercaditurno.asp"

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Charset": "utf-8",
                "Referer": "https://www.farmaciediturno.org/",
                "Origin": "https://www.farmaciediturno.org",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0"
            }
        )

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def search_pharmacies(
        self,
        cap: Optional[str] = None,
        city: Optional[str] = None,
        search_date: Optional[date] = None,
        search_time: Optional[dt_time] = None
    ) -> List[PharmacyShiftInfo]:
        """
        Cerca farmacie di turno o aperte.

        Args:
            cap: CAP per la ricerca
            city: Città per la ricerca
            search_date: Data per la ricerca (default: oggi)
            search_time: Ora per la ricerca (default: ora corrente)

        Returns:
            Lista di farmacie trovate
        """
        if not cap and not city:
            raise ValueError("Deve essere specificato almeno CAP o città")

        # Default to current date/time if not specified
        if not search_date:
            search_date = datetime.now().date()
        if not search_time:
            search_time = datetime.now().time()

        # Calculate day offset (1 = oggi, 2 = domani, etc.)
        today = datetime.now().date()
        day_offset = (search_date - today).days + 1
        if day_offset < 1:
            day_offset = 1  # Use today if date is in the past
        elif day_offset > 15:
            day_offset = 15  # Limit to 15 days max

        # Format time as HHMM (e.g., 2300 for 23:00)
        hour = search_time.hour
        minute = search_time.minute
        # Round to nearest 30 minutes
        if minute < 15:
            minute = 0
        elif minute < 45:
            minute = 30
        else:
            hour += 1
            minute = 0
        if hour >= 24:
            hour = 23
            minute = 30

        orario = hour * 100 + minute  # e.g., 23:30 = 2330

        # Prepare form data matching the actual form structure
        form_data = {
            "indirizzo": cap if cap else city,
            "giorno": str(day_offset),
            "orario": str(orario),
            "md": "Avvia la ricerca"
        }

        try:
            # Make POST request to search
            response = await self.client.post(self.SEARCH_URL, data=form_data)
            response.raise_for_status()

            # The site uses ISO-8859-1 (Latin-1) encoding, not UTF-8
            # We need to decode from Latin-1 and re-encode to UTF-8
            # This handles special Italian characters (è, é, à, ì, ù, ò, Ò, etc.)
            html_content = response.content.decode('iso-8859-1')

            # Parse HTML response with UTF-8
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract pharmacy boxes
            pharmacy_boxes = soup.find_all('div', class_='farmacia-box', itemtype='https://schema.org/Pharmacy')

            pharmacies = []
            for box in pharmacy_boxes:
                try:
                    pharmacy = self._parse_pharmacy_box(box)
                    if pharmacy:
                        pharmacies.append(pharmacy)
                except Exception as e:
                    # Log error but continue with other pharmacies
                    print(f"Error parsing pharmacy box: {e}")
                    continue

            return pharmacies

        except httpx.HTTPError as e:
            print(f"HTTP error during scraping: {e}")
            raise
        except Exception as e:
            print(f"Error during scraping: {e}")
            raise

    def _parse_pharmacy_box(self, box: BeautifulSoup) -> Optional[PharmacyShiftInfo]:
        """Parse single pharmacy box from HTML."""
        try:
            # Extract name
            name_elem = box.find('span', itemprop='name', class_='pharmacyname')
            if not name_elem:
                return None
            name = name_elem.get_text(strip=True)

            # Extract address components
            address_div = box.find('div', itemprop='address', itemtype='https://schema.org/PostalAddress')
            if not address_div:
                return None

            street_elem = address_div.find('span', itemprop='streetAddress')
            street = street_elem.get_text(strip=True) if street_elem else ""

            locality_elem = address_div.find('span', itemprop='addressLocality')
            locality_text = locality_elem.get_text(strip=True) if locality_elem else ""

            # Parse postal code and city from locality
            # Format can be: "21043 CASTIGLIONE OLONA" or "21043CASTIGLIONE OLONA" (without space)
            postal_code = ""
            city = ""
            if locality_text:
                # Try to extract CAP (5 digits) and city using regex
                match = re.match(r'^(\d{5})\s*(.+)$', locality_text)
                if match:
                    postal_code = match.group(1)
                    city = match.group(2).strip()
                else:
                    # Fallback: split by space if regex fails
                    parts = locality_text.split(maxsplit=1)
                    if len(parts) >= 1:
                        postal_code = parts[0]
                    if len(parts) >= 2:
                        city = parts[1].strip()

            region_elem = address_div.find('span', itemprop='addressRegion')
            province = region_elem.get_text(strip=True) if region_elem else ""

            # Extract status (TURNO/APERTO)
            status = "UNKNOWN"
            status_elem = box.find('a', class_='btorario')
            if status_elem:
                if 'cturno' in status_elem.get('class', []):
                    status = "TURNO"
                elif 'caperto' in status_elem.get('class', []):
                    status = "APERTO"

            # Extract opening hours
            opening_hours = None
            shift_hours = None
            orario_elems = box.find_all('a', class_='orario')
            for orario_elem in orario_elems:
                text = orario_elem.get_text(strip=True)
                if 'Apertura:' in text:
                    opening_hours = text.replace('Apertura:', '').strip()
                if 'Turno*:' in text:
                    shift_hours = text.replace('Turno*:', '').strip()

            # Extract phone number
            phone = None
            phone_link = box.find('a', href=lambda href: href and href.startswith('tel:'))
            if phone_link:
                phone = phone_link['href'].replace('tel:', '')

            # Extract distance
            distance_km = None
            distance_elem = address_div.find('span', class_='address')
            if distance_elem:
                distance_text = distance_elem.get_text()
                distance_match = re.search(r'Distanza stimata:\s*<b>([\d,]+)</b>\s*km', str(distance_elem))
                if distance_match:
                    try:
                        distance_km = float(distance_match.group(1).replace(',', '.'))
                    except ValueError:
                        pass

            # Extract image URL
            image_url = None
            img_elem = box.find('img', class_=['farimg1', 'farimg2'])
            if img_elem and img_elem.get('src'):
                image_url = img_elem['src']
                if image_url.startswith('//'):
                    image_url = 'https:' + image_url
                elif not image_url.startswith('http'):
                    image_url = self.BASE_URL + image_url

            # Extract details URL
            details_url = None
            details_link = box.find('a', href=lambda href: href and 'farmacia.asp?idf=' in href)
            if details_link:
                details_url = details_link['href']
                if not details_url.startswith('http'):
                    details_url = self.BASE_URL + details_url

            return PharmacyShiftInfo(
                name=name,
                address=street,
                city=city,
                province=province,
                postal_code=postal_code,
                status=status,
                opening_hours=opening_hours,
                shift_hours=shift_hours,
                phone=phone,
                distance_km=distance_km,
                image_url=image_url,
                details_url=details_url
            )

        except Exception as e:
            print(f"Error parsing pharmacy box: {e}")
            return None


# Singleton instance
scraping_service = ScrapingService()
