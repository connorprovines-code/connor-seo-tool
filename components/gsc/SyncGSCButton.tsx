'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface SyncGSCButtonProps {
  projectId: string
}

export default function SyncGSCButton({ projectId }: SyncGSCButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync GSC data')
      }

      setMessage(`✓ Synced ${data.rowsInserted} rows from GSC`)
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      setMessage(`✗ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleSync} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : 'Sync GSC Data'}
      </Button>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.startsWith('✓') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
