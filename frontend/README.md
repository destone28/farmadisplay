# FarmaDisplay Frontend

React + TypeScript dashboard per la gestione turni farmacie e configurazione bacheche elettroniche.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run development server:
```bash
npm run dev
```

The dashboard will be available at http://localhost:5173

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📁 Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # State management (Zustand)
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Routing
- **Axios** - HTTP client

## 🔧 Development

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Format code
npm run format
```

### Adding Components

```bash
# Create new component
mkdir src/components/MyComponent
touch src/components/MyComponent/MyComponent.tsx
touch src/components/MyComponent/index.ts
```

### State Management

- **Server State**: Use TanStack Query for API data
- **Client State**: Use Zustand for UI state
- **URL State**: Use React Router for navigation state

## 🌐 Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `VITE_API_URL`: Backend API URL
- `VITE_API_BASE_PATH`: API base path (default: /api/v1)

## 📦 Dependencies

### Core
- react, react-dom
- typescript
- vite

### UI
- tailwindcss
- lucide-react (icons)

### Data Management
- @tanstack/react-query
- axios
- zustand

### Routing
- react-router-dom

### Utilities
- date-fns
- clsx

## 🐳 Docker (Optional)

```bash
# Build image
docker build -t farmadisplay-frontend .

# Run container
docker run -p 5173:5173 farmadisplay-frontend
```

## 📝 License

MIT License - see [LICENSE](../LICENSE)
