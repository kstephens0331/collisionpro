import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'CollisionPro - Professional Auto Body Estimating',
  description: 'Enterprise-grade collision repair estimating software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}
