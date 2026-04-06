import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Olive & Fig ERP',
  description: 'Showroom Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}


