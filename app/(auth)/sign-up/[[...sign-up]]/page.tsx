import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">dradauto</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie sua conta de médico</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
