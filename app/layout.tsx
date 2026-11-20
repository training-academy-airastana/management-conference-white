import type { Metadata } from 'next';
import './globals.css';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const metadata: Metadata = { title: 'Going Global: From Ambition to Execution | Air Astana Group', description: 'Air Astana Group XVIII Management Conference 2026 – Going Global: From Ambition to Execution. December 3, 2026. InterContinental Almaty. Hybrid conference.', icons: { icon: `${basePath}/air-astana-mark.png`, apple: `${basePath}/air-astana-mark.png` } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
