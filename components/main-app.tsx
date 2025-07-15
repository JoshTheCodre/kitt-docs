"use client"

import { useState } from "react"
import { Home, Search, Wallet, BookOpen, Upload } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import HomeScreen from "./screens/home-screen"
import ExploreScreen from "./screens/explore-screen"
import WalletScreen from "./screens/wallet-screen"
import LibraryScreen from "./screens/library-screen"
import UploadScreen from "./screens/upload-screen"
import ProfileScreen from "./screens/profile-screen"
import ResourceDetailScreen from "./screens/resource-detail-screen"

interface MainAppProps {
  user: SupabaseUser
}

type Screen = "home" | "explore" | "wallet" | "library" | "upload" | "profile" | "resource-detail"

export default function MainApp({ user }: MainAppProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [selectedResource, setSelectedResource] = useState(null)

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource)
    setCurrentScreen("resource-detail")
  }

  const handleBackFromResourceDetail = () => {
    setSelectedResource(null)
    setCurrentScreen("explore")
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen user={user} onNavigate={setCurrentScreen} />
      case "explore":
        return <ExploreScreen user={user} onNavigate={setCurrentScreen} onResourceSelect={handleResourceSelect} />
      case "wallet":
        return <WalletScreen user={user} onNavigate={setCurrentScreen} />
      case "library":
        return <LibraryScreen user={user} onNavigate={setCurrentScreen} onResourceSelect={handleResourceSelect} />
      case "upload":
        return <UploadScreen user={user} onNavigate={setCurrentScreen} />
      case "profile":
        return <ProfileScreen user={user} onNavigate={setCurrentScreen} />
      case "resource-detail":
        return <ResourceDetailScreen user={user} resource={selectedResource} onNavigate={setCurrentScreen} onBack={handleBackFromResourceDetail} />
      default:
        return <HomeScreen user={user} onNavigate={setCurrentScreen} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Main Content */}
        <div className="pb-20">{renderScreen()}</div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setCurrentScreen("home")}
              className={`flex flex-col items-center space-y-1 p-2 ${
                currentScreen === "home" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setCurrentScreen("explore")}
              className={`flex flex-col items-center space-y-1 p-2 ${
                currentScreen === "explore" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <Search className="w-6 h-6" />
              <span className="text-xs">Explore</span>
            </button>

            <button
              onClick={() => setCurrentScreen("wallet")}
              className={`flex flex-col items-center space-y-1 p-2 ${
                currentScreen === "wallet" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <Wallet className="w-6 h-6" />
              <span className="text-xs">Wallet</span>
            </button>

            <button
              onClick={() => setCurrentScreen("library")}
              className={`flex flex-col items-center space-y-1 p-2 ${
                currentScreen === "library" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Library</span>
            </button>

            <button
              onClick={() => setCurrentScreen("upload")}
              className={`flex flex-col items-center space-y-1 p-2 ${
                currentScreen === "upload" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs">Upload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
