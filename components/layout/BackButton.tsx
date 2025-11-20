'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show back button on main pages
  const mainPages = ['/dashboard', '/projects', '/keyword-research', '/outreach', '/settings']
  const isMainPage = mainPages.includes(pathname)

  if (isMainPage) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="mb-4"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  )
}
