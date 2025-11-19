import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import CreateTemplateButton from '@/components/outreach/CreateTemplateButton'
import TemplateList from '@/components/outreach/TemplateList'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: templates } = await supabase
    .from('outreach_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage your outreach email templates</p>
        </div>
        <CreateTemplateButton />
      </div>

      {templates && templates.length > 0 ? (
        <TemplateList templates={templates} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              Create email templates to streamline your outreach campaigns
            </p>
            <CreateTemplateButton />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
