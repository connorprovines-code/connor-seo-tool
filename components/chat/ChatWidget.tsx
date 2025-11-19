'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border">
          <div className="p-4 border-b flex justify-between items-center bg-primary text-white rounded-t-lg">
            <h3 className="font-semibold">SEO Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center text-gray-500 py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm">
                AI Chat Assistant coming soon!
              </p>
              <p className="text-xs mt-2">
                Ask questions about your SEO data and get intelligent insights.
              </p>
            </div>
          </div>

          <div className="p-4 border-t">
            <input
              type="text"
              placeholder="Ask about your SEO data..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled
            />
          </div>
        </div>
      )}
    </div>
  )
}
