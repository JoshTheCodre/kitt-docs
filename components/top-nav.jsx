"use client"

import { ArrowLeft, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TopNav({
  title,
  showBack = false,
  showSearch = false,
  showNotifications = false,
  onBack,
  onSearch,
  rightAction,
}) {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          {showSearch && (
            <Button variant="ghost" size="sm" onClick={onSearch} className="rounded-xl p-2">
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showNotifications && (
            <Button variant="ghost" size="sm" className="rounded-xl p-2 relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>
          )}
          {rightAction}
        </div>
      </div>
    </div>
  )
}
