"use client"

import { Search, Grid3X3, User, Home, ImageIcon, ShoppingCart, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HomeScreenProps {
  onCourseClick: () => void
}

export default function HomeScreen({ onCourseClick }: HomeScreenProps) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">Welcome,</p>
            <h2 className="text-xl font-bold text-gray-900">Arya Wijaya 👋</h2>
          </div>
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
           
          </div>
        </div>

        {/* Explore Your Favorite Class Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-bold text-lg mb-1">Explore Your</h3>
              <h3 className="font-bold text-lg mb-3">Favorite Class</h3>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-xl text-sm">
                Explore
              </Button>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
              <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search Online Course"
            className="pl-10 pr-12 py-3 rounded-xl border-gray-200 bg-gray-50"
          />
          <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 p-2 rounded-lg">
            <Grid3X3 className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Popular Course Section */}
      <div className="flex-1 px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Popular Course</h3>
          <Button variant="ghost" className="text-blue-500 text-sm font-medium">
            More →
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Looks Skena Course */}
          <div
            onClick={onCourseClick}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 relative overflow-hidden cursor-pointer"
          >
            <div className="text-white">
              <div className="text-2xl font-bold mb-2">$120</div>
              <div className="absolute bottom-4">
                <h4 className="font-bold text-sm mb-1">Looks Skena</h4>
                <p className="text-xs opacity-90">18 Videos</p>
              </div>
              {/* Play button */}
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
              </div>
            </div>
          </div>

          {/* Marketing Course */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 relative overflow-hidden">
            <div className="text-white">
              <div className="absolute bottom-4">
                <h4 className="font-bold text-sm mb-1">Marketing</h4>
                <p className="text-xs opacity-90">12 Videos</p>
              </div>
              {/* Megaphone icon placeholder */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex items-center justify-around">
          <Home className="w-6 h-6 text-blue-500" />
          <ImageIcon className="w-6 h-6 text-gray-400" />
          <ShoppingCart className="w-6 h-6 text-gray-400" />
          <MoreHorizontal className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
