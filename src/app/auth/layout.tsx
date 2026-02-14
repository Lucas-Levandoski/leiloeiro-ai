export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-md space-y-4">
        {children}
      </div>
    </div>
  )
}
