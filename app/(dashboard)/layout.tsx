import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/layout/DashboardNav'
import { ChatWidget } from '@/components/chat/ChatWidget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="lg:pl-64">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  )
}
