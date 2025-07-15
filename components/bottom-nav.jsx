
"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, Search, Wallet, BookOpen, Upload } from "lucide-react"

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: BookOpen, label: "Library", path: "/library" },
    { icon: Upload, label: "Upload", path: "/upload" },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-3 z-50">
      <div className="flex items-center justify-around">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            className={`flex flex-col items-center space-y-1 p-2 ${
              pathname === path ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
