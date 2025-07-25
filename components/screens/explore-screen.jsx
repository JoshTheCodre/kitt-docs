"use client";

import { useState, useEffect } from "react";
import {
  Filter,
  Grid3X3,
  BookOpen,
  FileText,
  Calculator,
  Microscope,
  Scale,
  Search,
} from "lucide-react";
import { fetchExploreResources, checkUserDownloadedResources, fetchTrendingTags } from "@/functions/exploreFunctions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TopNav from "@/components/top-nav";
import ModernSearch from "@/components/modern-search";
import { ResourceCardSkeleton } from "@/components/loading-skeleton";
import { toast } from "sonner";

const departments = [
  "Computer Science",
  "Engineering",
  "Medicine",
  "Law",
  "Business Administration",
  "Economics",
  "Psychology",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "English",
];

export default function ExploreScreen({ user, onNavigate, onResourceSelect }) {
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    loadExploreData();
  }, [searchQuery, departmentFilter, levelFilter, priceFilter, verifiedFilter]);

  const loadExploreData = async () => {
    setLoading(true);
    try {
      const filters = {
        searchQuery,
        departmentFilter,
        levelFilter,
        priceFilter,
        verifiedFilter
      };
      
      const [resourcesData, tagsData] = await Promise.all([
        fetchExploreResources(filters),
        fetchTrendingTags()
      ]);
      
      // Check which resources user has downloaded
      const resourcesWithDownloadStatus = await checkUserDownloadedResources(user?.id, resourcesData);
      
      setResources(resourcesWithDownloadStatus);
      setTrendingTags(tagsData);
    } catch (error) {
      console.error("Error loading explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExploreData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav
        title="Explore"
        showBack
        onBack={() => onNavigate("home")}
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-lg"
          >
            <Filter className="w-5 h-5" />
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Search */}
        <ModernSearch
          tags={trendingTags}
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          showSuggestions
        />

        {/* Filters */}
        {showFilters && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="rounded-xl border-gray-200 h-12">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-3 gap-3">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Verified ✅</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trending Search */}
    
        {!searchQuery && (
          <div className="text-center py-12 ease-in-out">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search it. Find it. Own it. 
            </h3>
            <p className="text-gray-600">
              Type anything and get instant study vibes! 📝
            </p>
          </div>)
        }

        {/* Results */}
        {searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Search Results ({resources.length})
              </h3>
              <Button variant="ghost" size="sm" className="rounded-lg">
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="rounded-xl card-shadow hover:shadow-lg transition-shadow cursor-pointer bg-white"
                    onClick={resource.isDownloaded ? toast('Already Downloaded , Go to Library') :() => onResourceSelect(resource)}
                  >
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {resource.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {resource.description || "No description available"}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Badge
                                variant="secondary"
                                className="text-xs rounded-md"
                              >
                                {resource.department}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs rounded-md"
                              >
                                Level {resource.level}
                              </Badge>
                              {resource.isDownloaded && (
                                <Badge
                                  variant="outline"
                                  className="text-xs rounded-md text-green-600 border-green-200 bg-green-50"
                                >
                                  Downloaded
                                </Badge>
                              )}
                            </div>
                            <span className="text-blue-600 font-bold text-sm">
                              {resource.isDownloaded ? "" : 
                                resource.price === 0
                                ? "Free"
                                : `₦${resource.price.toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {resources.length === 0 && !loading && searchQuery && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No resources found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
