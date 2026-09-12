'use client'

import { useAuth } from '@/components/auth-provider'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RecoveryRedirect() {
  const { passwordRecovery } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (passwordRecovery && pathname !== '/update-password') {
      router.replace('/update-password')
    }
  }, [passwordRecovery, pathname, router])

  return null
}
