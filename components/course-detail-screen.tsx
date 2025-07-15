"use client"

import { ArrowLeft, Play, Clock, Video, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CourseDetailScreenProps {
  onBack: () => void
}

export default function CourseDetailScreen({ onBack }: CourseDetailScreenProps) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header with course image */}
      <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 h-64 overflow-hidden">
        <Button onClick={onBack} variant="ghost" className="absolute top-4 left-4 z-10 text-white p-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>

        {/* 3D Character illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-red-500 rounded-full relative">
              {/* Character with umbrella */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-blue-600 rounded-full"></div>
              <div className="absolute top-4 left-4 w-4 h-4 bg-white rounded-full"></div>
              <div className="absolute top-8 right-4 w-6 h-6 bg-pink-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="w-full h-1 bg-white bg-opacity-30 rounded-full">
            <div className="w-1/3 h-full bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">How to Looks Skena</h1>

        <div className="flex items-center space-x-4 mb-4 text-gray-500 text-sm">
          <div className="flex items-center space-x-1">
            <Video className="w-4 h-4" />
            <span>21 Videos</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>186 minute</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          In this course, you will delve into the art of fashion styling, learning how to curate a wardrobe...
          <span className="text-blue-500 font-medium">See More</span>
        </p>

        {/* Course Content */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between p-4 bg-blue-500 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h4 className="font-medium">What is Skena Outfit?</h4>
                <p className="text-xs text-blue-100">3.1 minutes</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-sm">😊</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-500 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h4 className="font-medium">How to become an outfit that is really Skena</h4>
                <p className="text-xs text-blue-100">7.0 minutes</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-sm">😊</span>
            </div>
          </div>
        </div>

        {/* Buy Now Button */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl text-lg">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}
