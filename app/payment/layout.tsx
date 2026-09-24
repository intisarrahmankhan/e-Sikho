import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }

  return <>{children}</>
}
