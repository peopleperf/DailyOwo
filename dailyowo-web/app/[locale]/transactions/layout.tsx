'use client'

import { AuthProvider } from '@/lib/firebase/auth-context'
import { Toaster } from 'react-hot-toast'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className={`min-h-screen bg-white ${inter.className}`}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#262659',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#A67C00',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </div>
    </AuthProvider>
  )
} 