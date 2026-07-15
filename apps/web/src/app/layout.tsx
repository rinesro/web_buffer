import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'SBM-NAC — Server Buffer Monitoring & Network Access Control',
  description:
    'Real-time server resource monitoring and network access control for registered devices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`}>
        <script
          // Runs before React hydrates so there's no flash of the wrong theme. Mirrors the
          // shape Zustand's persist middleware writes to localStorage for the theme store.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var raw=localStorage.getItem('sbm-nac-theme');var theme=raw?JSON.parse(raw).state.theme:'dark';if(theme==='dark'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
