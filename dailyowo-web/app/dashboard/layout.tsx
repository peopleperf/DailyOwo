'use client'

import { AuthProvider, useAuth } from '@/lib/firebase/auth-context'
import { Toaster, toast } from 'react-hot-toast'
import { Inter } from 'next/font/google'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { GlassButton } from '@/components/ui/GlassButton'

const inter = Inter({ subsets: ['latin'] })

const EmailVerificationBanner = () => {
  const { user, emailVerified, sendVerificationEmail } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    setIsSending(true)
    try {
      await sendVerificationEmail()
      toast.success('Verification email sent successfully.')
    } catch (error) {
      console.error(error)
      // A more specific error could be shown based on the error code
      toast.error('Failed to send verification email.')
    } finally {
      setIsSending(false)
    }
  }

  if (!user || emailVerified || isDismissed) {
    return null
  }

  return (
    <div
      className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 shadow-md"
      role="alert"
    >
      <div className="flex items-center">
        <Icon name="alertTriangle" className="h-6 w-6 text-yellow-500 mr-4" />
        <div className="flex-grow">
          <p className="font-bold">Verify Your Email</p>
          <p className="text-sm">Please check your inbox to verify your email address.</p>
        </div>
        <div className="flex items-center ml-4">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleResend}
            loading={isSending}
            className="mr-2 border-yellow-600 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500"
          >
            Resend Email
          </GlassButton>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss"
            className="p-1.5 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-100 focus:ring-yellow-600"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
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
        <EmailVerificationBanner />
        {children}
      </div>
    </AuthProvider>
  )
}