import { Metadata } from 'next'
import Link from 'next/link'
import { Settings as SettingsIcon, Link as LinkIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and integrations',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and integrations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Integrations Card */}
        <Link
          href="/settings/integrations"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Integrations
          </h2>
          <p className="text-gray-600">
            Connect and manage third-party services like Google Search Console
          </p>
        </Link>

        {/* Account Settings Card - Coming Soon */}
        <div className="p-6 bg-white rounded-lg border border-gray-200 opacity-50">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Account Settings
          </h2>
          <p className="text-gray-600">
            Manage your profile, password, and preferences
          </p>
          <span className="inline-block mt-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}
