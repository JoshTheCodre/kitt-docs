"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockSuggestions, searchPlaceholders } from "@/lib/mock-data";

export default function ModernSearch({
  tags,
  value,
  onChange,
  onSearch,
  showSuggestions = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(
    searchPlaceholders[0],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => {
        const currentIndex = searchPlaceholders.indexOf(prev);
        const nextIndex = (currentIndex + 1) % searchPlaceholders.length;
        return searchPlaceholders[nextIndex];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400" />
          {!value && (
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          )}
        </div>
        <Input
          placeholder={currentPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-16 pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white h-14 text-lg placeholder:text-gray-500 shadow-sm transition-all duration-300"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {/* <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
            <Search className="w-4 h-4 text-white" />
          </div> */}
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              Trending Searches
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 6).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors rounded-lg capitalize border "
                onClick={() => {
                  onChange(suggestion);
                  onSearch();
                }}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
