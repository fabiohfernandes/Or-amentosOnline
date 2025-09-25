# OrçamentosOnline Frontend

Modern React/Next.js frontend application for the OrçamentosOnline platform.

## 🚀 Built by NOVA Agent

This frontend application was architected and developed by **NOVA** (Frontend Development Specialist) as part of the OrçamentosOnline platform development process.

## ✨ Features

- **Modern React/Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for API data fetching
- **React Hook Form** with Zod validation
- **Real-time collaboration** with WebSocket support
- **Responsive design** for all devices
- **Accessibility** compliant (WCAG 2.2 AA)
- **PWA ready** with service worker support

## 🛠️ Technology Stack

### Core
- **Next.js 14** - React framework with App Router
- **TypeScript** - Static type checking
- **React 18** - UI library with concurrent features

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Custom design system** - Consistent branding and components

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Hook Form** - Form state management

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **Storybook** - Component development

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── proposals/         # Proposal management pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and API client
├── store/                 # Zustand state stores
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── config/                # Configuration files
└── styles/                # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=OrçamentosOnline
VITE_APP_VERSION=1.0.0
VITE_MAX_FILE_SIZE=10485760
VITE_SUPPORTED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

## 📦 Docker Support

The application is fully containerized and integrates with the Docker Compose setup:

### Development
```bash
docker-compose up frontend
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up frontend
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🏗️ Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

Analyze bundle size:
```bash
npm run analyze
```

## 🎨 Storybook

Develop components in isolation:

```bash
npm run storybook
```

Build Storybook:
```bash
npm run build-storybook
```

## 📱 Progressive Web App

The application is configured as a PWA with:
- Service worker for offline support
- Web app manifest
- App-like installation on mobile devices

## ♿ Accessibility

The application follows WCAG 2.2 AA guidelines:
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## 🔒 Security

Security features implemented:
- Content Security Policy headers
- XSS protection
- CSRF protection
- Secure authentication flow
- Input validation and sanitization

## 📊 Performance

Performance optimizations:
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies
- Core Web Vitals optimization

## 🤝 Integration

### API Integration
The frontend connects to the backend API at `/api/v1` with:
- JWT authentication
- Automatic token refresh
- Request/response interceptors
- Error handling

### Real-time Features
WebSocket integration for:
- Live collaboration
- Real-time updates
- Typing indicators
- User presence

## 📚 Documentation

- [Component Library](./docs/components.md)
- [State Management](./docs/state-management.md)
- [API Integration](./docs/api-integration.md)
- [Deployment Guide](./docs/deployment.md)

## 🔧 Configuration

### Tailwind CSS
The design system is configured in `tailwind.config.js` with:
- Custom color palette
- Extended spacing and typography
- Component classes
- Responsive breakpoints

### TypeScript
Strict TypeScript configuration with:
- Path mapping for imports
- Strict type checking
- Custom type definitions

## 📈 Monitoring

Production monitoring setup:
- Performance metrics
- Error tracking
- User analytics
- Bundle analysis

## 🚀 Deployment

The application is deployed using Docker containers:

1. Build the production image:
```bash
docker build -t orcamentos-frontend .
```

2. Run with Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up
```

## 🤖 NOVA Agent Notes

This frontend application was built with the following principles:

1. **Educational Focus**: Code is well-commented and structured for learning
2. **Modern Best Practices**: Uses the latest React and Next.js patterns
3. **Accessibility First**: WCAG 2.2 AA compliance throughout
4. **Performance Optimized**: Fast loading and excellent Core Web Vitals
5. **Developer Experience**: Excellent tooling and development workflow

The application provides a solid foundation for the OrçamentosOnline platform and can be extended with additional features as needed.

## 📝 License

This project is part of the OrçamentosOnline platform developed by the NOVA team.