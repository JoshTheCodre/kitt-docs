"use client"

import { Button } from "@/components/ui/button"

interface OnboardingScreenProps {
  onGetStarted: () => void
}

export default function OnboardingScreen({ onGetStarted }: OnboardingScreenProps) {
  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-500 to-blue-600 p-6 flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-4 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-white text-2xl font-bold">Aa</span>
      </div>

      {/* 3D Character illustration placeholder */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative">
          {/* Main character - simplified representation */}
          <div className="w-48 h-48 bg-red-500 rounded-full relative">
            {/* Character details */}
            <div className="absolute top-8 left-12 w-8 h-8 bg-yellow-400 rounded-full"></div>
            <div className="absolute top-16 right-8 w-12 h-12 bg-pink-400 rounded-lg"></div>
            <div className="absolute bottom-12 left-8 w-6 h-6 bg-blue-300 rounded-full"></div>
          </div>

          {/* Floating elements */}
          <div className="absolute -top-8 -right-4 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-red-400 rounded"></div>
          </div>

          <div className="absolute -bottom-4 -left-8 w-16 h-10 bg-yellow-400 rounded-lg"></div>
        </div>
      </div>

      {/* Content */}
      <div className="text-center text-white mb-8">
        <h1 className="text-3xl font-bold mb-4 leading-tight">
          Embrace Learning,
          <br />
          Fuel Creative
          <br />
          Expression.
        </h1>
        <p className="text-blue-100 text-sm mb-8">
          Expand your knowledge & nurture
          <br />
          creativity with our online courses.
        </p>

        <Button
          onClick={onGetStarted}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-4 rounded-2xl text-lg"
        >
          Get Started
        </Button>
      </div>
    </div>
  )
}
