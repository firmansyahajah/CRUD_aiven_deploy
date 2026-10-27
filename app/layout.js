import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from './hooks/useStore';
import Nav from './components/Nav';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Kasir',
  description: 'Aplikasi kasir untuk warung dan kafe kecil',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={font.variable}>
      <body>
        <StoreProvider>
          <Nav />
          <main>{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
