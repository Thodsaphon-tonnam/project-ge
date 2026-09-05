import { AuthProvider } from '@/components/auth-provider'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai, Geist_Mono } from 'next/font/google'
import './globals.css'

const notoThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-noto-thai',
  weight: ['400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'CoE ส่งต่อ · คลังข้อสอบและชีทสรุปวิศวกรรมคอมพิวเตอร์',
  description:
    'คลังข้อสอบเก่า ชีทสรุป และสรุปแลปสำหรับนักศึกษาวิศวกรรมคอมพิวเตอร์ (CoE) ค้นหาด้วยรหัสวิชา ชื่อวิชา หรือชื่อเอกสาร',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1e293b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`light ${notoThai.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans antialiased">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
