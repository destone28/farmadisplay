# FarmaDisplay - Display Page

Pagina display pubblica ultra-leggera per visualizzare turni farmacie su bacheche elettroniche.

## 🎯 Caratteristiche

- **Ultra-leggero**: <10KB totali (HTML + CSS + JS)
- **Vanilla JS**: Nessuna dipendenza, nessun framework
- **PWA Ready**: Service Worker per funzionalità offline
- **Auto-refresh**: Aggiornamento automatico ogni 60 secondi
- **Responsive**: Funziona su qualsiasi schermo
- **Ottimizzato per Raspberry Pi**: Performance eccellenti su hardware limitato

## 📁 File Structure

```
display/
├── index.html     # Pagina HTML principale
├── style.css      # Stili CSS
├── app.js         # Logica JavaScript
└── sw.js          # Service Worker per funzionalità offline
```

## 🚀 Usage

### Development

Serve i file con un web server locale:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

Poi apri http://localhost:8080

### Production

Configura nginx per servire i file statici:

```nginx
location /display {
    alias /var/www/farmadisplay/display;
    try_files $uri $uri/ /display/index.html;
}
```

## ⚙️ Configuration

Modifica `app.js` per configurare:

```javascript
// API endpoint
const API_BASE_URL = '/api/v1';

// Intervallo di aggiornamento (millisecondi)
const REFRESH_INTERVAL = 60000;
```

## 🎨 Customization

### Colors

Modifica le variabili CSS in `style.css`:

```css
:root {
    --primary-color: #0ea5e9;
    --secondary-color: #0369a1;
    --background: #f0f9ff;
    --text-color: #0c4a6e;
}
```

### Layout

Il layout è completamente personalizzabile modificando HTML e CSS.

## 📱 PWA Features

La pagina include un Service Worker che fornisce:

- **Cache**: Risorse statiche in cache per caricamenti rapidi
- **Offline**: Funziona anche senza connessione
- **Auto-update**: Cache aggiornata automaticamente

## 🔧 API Integration

La display page si aspetta questa struttura dati dall'API:

```json
{
  "today": [
    {
      "pharmacy_name": "Farmacia Rossi",
      "address": "Via Roma 123",
      "date": "2025-01-15",
      "phone": "+39 123 456 7890"
    }
  ],
  "upcoming": [
    {
      "pharmacy_name": "Farmacia Bianchi",
      "address": "Via Milano 45",
      "date": "2025-01-16",
      "phone": "+39 098 765 4321"
    }
  ]
}
```

## 🎭 Demo Mode

Per testare senza backend, modifica `app.js` per usare dati mock:

```javascript
async function loadShifts() {
    const mockData = {
        today: [
            {
                pharmacy_name: "Farmacia Test",
                address: "Via Test 123",
                date: "2025-01-15",
                phone: "+39 123 456 7890"
            }
        ],
        upcoming: []
    };
    renderShifts(mockData);
    showContent();
}
```

## 📊 Performance

Target performance metrics:

- **First Contentful Paint**: <1s
- **Time to Interactive**: <2s
- **Total Size**: <10KB (gzipped)
- **Memory Usage**: <50MB

Ottimizzato per:
- Raspberry Pi Zero 2 W
- Display 1080p 60fps
- Connessioni lente (3G+)

## 🐛 Debugging

Abilita console logging in `app.js`:

```javascript
const DEBUG = true;

if (DEBUG) {
    console.log('Data loaded:', data);
}
```

## 📝 License

MIT License - see [LICENSE](../LICENSE)
