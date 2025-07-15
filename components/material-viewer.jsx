
"use client"

import { useState } from "react"
import { FileText, Image, Download, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MaterialViewer({ resource, onClose }) {
  const [zoom, setZoom] = useState(100)

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return FileText
    if (fileType.startsWith("image/")) return Image
    return FileText
  }

  const FileIcon = getFileIcon(resource.file_type)

  const handleDownload = () => {
    // Get the public URL from Supabase storage
    const { data } = supabase
      .storage
      .from('resources') // bucket name
      .getPublicUrl(resource.storage_path) // storage_path should be the path relative to the bucket

    // If the public URL exists, trigger the download
    if (data && data.publicUrl) {
      const link = document.createElement('a')
      link.href = data.publicUrl
      link.download = '' // This will trigger download, you can specify a filename here
      document.body.appendChild(link) // Needed for Firefox
      link.click()
      document.body.removeChild(link)
    } else {
      // Handle error (optional)
      alert('Could not generate download link!')
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{resource.title}</h3>
              <p className="text-sm text-gray-600">{resource.file_type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {resource.file_type === "application/pdf" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0 flex-1 overflow-auto">
          {resource.file_type === "application/pdf" ? (
            <div className="h-[600px] bg-gray-100 flex items-center justify-center">
              <iframe
                src={resource.storage_path}
                className="w-full h-full border-0"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>
          ) : resource.file_type.startsWith("image/") ? (
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[400px]">
              <img
                src={resource.storage_path}
                alt={resource.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview not available
              </h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <Button onClick={handleDownload} className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Download to view
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
