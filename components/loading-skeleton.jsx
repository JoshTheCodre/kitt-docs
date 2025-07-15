"use client"

export function ResourceCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex space-x-2">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-xl mx-auto mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="text-center animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
    </div>
  )
}
