"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload } from 'lucide-react'

export function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const response = await fetch('/api/outpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: 'hello'
        })
      })

      const result = await response.json()
      console.log('Response from Python:', result)
      
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full bg-[#fffcf5] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_24px_rgba(0,0,0,0.1)] border-0">
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 text-base border-2 border-gray-300 rounded focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-900 border-2 border-orange-200"
              disabled={isUploading}
            >
              {isUploading ? "Processing..." : "Outpaint"}
            </Button>
            <Button 
              variant="outline" 
              className="border-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

