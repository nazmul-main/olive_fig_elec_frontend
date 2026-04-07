import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
export const metadata = {
  title: 'Olive & Fig ERP',
  description: 'Showroom Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}


