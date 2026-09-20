import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
export const metadata: Metadata = {
  title: 'Worklog — Personal Timesheets',
  description: 'Private personal timesheets with secure online storage, weekly editing, and monthly reports.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}
