// ============================================================================
// Root Layout - Main App Layout with Providers
// NOVA Agent - Frontend Development Specialist
// ============================================================================

import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { appConfig } from '@/config';
import { Providers } from './providers';
import { cn } from '@/utils';
import '@/styles/globals.css';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: appConfig.appName,
    template: `%s | ${appConfig.appName}`,
  },
  description: 'Plataforma moderna para criação e gestão de orçamentos online com colaboração em tempo real.',
  keywords: [
    'orçamentos',
    'propostas',
    'gestão',
    'colaboração',
    'online',
    'business',
    'quotations',
    'estimates',
  ],
  authors: [
    {
      name: 'NOVA Agent - Frontend Development Specialist',
      url: 'https://github.com/orcamentos-online',
    },
  ],
  creator: 'OrçamentosOnline Team',
  publisher: 'OrçamentosOnline',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3001',
    title: appConfig.appName,
    description: 'Plataforma moderna para criação e gestão de orçamentos online com colaboração em tempo real.',
    siteName: appConfig.appName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${appConfig.appName} - Gestão de Orçamentos Online`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: appConfig.appName,
    description: 'Plataforma moderna para criação e gestão de orçamentos online com colaboração em tempo real.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    // Add verification IDs when ready for production
    // google: 'verification-code',
    // yandex: 'verification-code',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        'h-full bg-gray-50',
        inter.variable,
        jetbrainsMono.variable
      )}
      suppressHydrationWarning
    >
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content={appConfig.appName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appConfig.appName} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2563eb" />

        {/* Performance optimization */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: appConfig.appName,
              description: 'Plataforma moderna para criação e gestão de orçamentos online',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'All',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              url: process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3001',
              author: {
                '@type': 'Organization',
                name: 'OrçamentosOnline Team',
              },
            }),
          }}
        />
      </head>
      <body
        className={cn(
          'h-full font-sans antialiased',
          'selection:bg-primary-100 selection:text-primary-900'
        )}
      >
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-md font-medium"
        >
          Pular para o conteúdo principal
        </a>

        {/* App providers and content */}
        <Providers>
          <div id="root" className="h-full">
            {children}
          </div>
        </Providers>

        {/* Portal for modals and toasts */}
        <div id="modal-root" />
        <div id="toast-root" />

        {/* Performance monitoring script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}