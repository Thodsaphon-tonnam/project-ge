import { LoginForm } from '@/app/login/login-form'
import { SiteHeader } from '@/components/site-header'
import { LoaderCircle } from 'lucide-react'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <Suspense
          fallback={
            <div className="flex justify-center text-muted-foreground">
              <LoaderCircle className="size-8 animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
