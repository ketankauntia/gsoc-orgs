'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button, Input, SectionHeader } from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'
import { OrganizationCard } from '@/components/organization-card'
import { FiltersSidebar, FilterState } from './filters-sidebar'

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface OrganizationsClientProps {
  initialData: PaginatedResponse<Organization>
  initialPage: number
}

export function OrganizationsClient({ initialData, initialPage }: OrganizationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<Organization>>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const isInitialMount = useRef(true)
  const lastFetchParams = useRef<string>('')
  const lastUrlString = useRef<string>('')
  
  // Parse searchParams once into primitive values to avoid object recreation
  // This prevents useSearchParams() from causing unnecessary re-renders
  const urlSearch = searchParams.get('q') || ''
  const urlYear = searchParams.get('year') || null
  const urlCategory = searchParams.get('category') || null
  const urlTech = searchParams.get('tech') || null
  const urlTopic = searchParams.get('topic') || null
  const urlDifficulties = searchParams.get('difficulties') || ''
  
  // Memoize filters from URL using primitives to avoid unnecessary recalculations
  const urlFilters = useMemo<FilterState>(() => ({
    search: urlSearch,
    year: urlYear,
    category: urlCategory,
    tech: urlTech,
    topic: urlTopic,
    difficulties: urlDifficulties ? urlDifficulties.split(',').filter(Boolean) : [],
  }), [urlSearch, urlYear, urlCategory, urlTech, urlTopic, urlDifficulties])
  
  const [filters, setFilters] = useState<FilterState>(urlFilters)
  const [searchInput, setSearchInput] = useState(urlFilters.search)
  
  // Debounce search input to avoid excessive navigation
  const debouncedSearch = useDebounce(searchInput, 300)

  // Sync filters from URL only when URL actually changes (not on every render)
  // Use URL string comparison instead of object comparison
  useEffect(() => {
    const currentUrlString = searchParams.toString()
    
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastUrlString.current = currentUrlString
      setSearchInput(urlFilters.search)
      return
    }
    
    // Only update if URL actually changed
    if (currentUrlString === lastUrlString.current) {
      return
    }
    
    lastUrlString.current = currentUrlString
    
    // Only update if filters actually changed
    const filtersChanged = 
      filters.search !== urlFilters.search ||
      filters.year !== urlFilters.year ||
      filters.category !== urlFilters.category ||
      filters.tech !== urlFilters.tech ||
      filters.topic !== urlFilters.topic ||
      JSON.stringify(filters.difficulties) !== JSON.stringify(urlFilters.difficulties)
    
    if (filtersChanged) {
      setFilters(urlFilters)
      setSearchInput(urlFilters.search)
    }
  }, [urlSearch, urlYear, urlCategory, urlTech, urlTopic, urlDifficulties, filters, urlFilters])
  
  // handleFilterChange must be declared before useEffect that uses it
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    // Prevent unnecessary updates if filters haven't changed
    const filtersChanged = 
      filters.search !== newFilters.search ||
      filters.year !== newFilters.year ||
      filters.category !== newFilters.category ||
      filters.tech !== newFilters.tech ||
      filters.topic !== newFilters.topic ||
      JSON.stringify(filters.difficulties) !== JSON.stringify(newFilters.difficulties)
    
    if (!filtersChanged) return
    
    // Build URL params first
    const params = new URLSearchParams()
    // Reset to page 1 when filters change
    if (newFilters.search) params.set('q', newFilters.search)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.tech) params.set('tech', newFilters.tech)
    if (newFilters.year) params.set('year', newFilters.year)
    if (newFilters.topic) params.set('topic', newFilters.topic)
    if (newFilters.difficulties.length > 0) {
      params.set('difficulties', newFilters.difficulties.join(','))
    }
    
    const newUrl = `/organizations?${params.toString()}`
    
    // Update state and navigate - use startTransition to keep UI responsive
    setFilters(newFilters)
    // Use startTransition to make navigation non-blocking (especially helpful on low-end devices)
    startTransition(() => {
      router.push(newUrl, { scroll: false })
    })
  }, [filters, router])
  
  // Handle debounced search input
  useEffect(() => {
    if (isInitialMount.current) return
    
    if (debouncedSearch !== filters.search) {
      handleFilterChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch, filters, handleFilterChange])

  // Memoize fetch function to avoid recreating on every render
  const fetchOrganizations = useCallback(async (page: number, filterState: FilterState) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (filterState.search) params.set('q', filterState.search)
      if (filterState.category) params.set('category', filterState.category)
      if (filterState.tech) params.set('tech', filterState.tech)
      if (filterState.year) params.set('year', filterState.year)
      if (filterState.difficulties.length > 0) params.set('difficulties', filterState.difficulties.join(','))
      if (filterState.topic) params.set('topic', filterState.topic)
      
      const paramsString = params.toString()
      
      // Prevent duplicate fetches with same parameters
      if (lastFetchParams.current === paramsString) {
        setIsLoading(false)
        return
      }
      
      lastFetchParams.current = paramsString
      
      const response = await fetch(`/api/organizations?${paramsString}`)
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle page changes from URL
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1
    if (page !== currentPage) {
      setCurrentPage(page)
      fetchOrganizations(page, filters)
    }
  }, [searchParams, currentPage, filters, fetchOrganizations])

  // Only fetch when filters change (not on initial mount, as we have initialData)
  useEffect(() => {
    if (isInitialMount.current) {
      return
    }
    // Reset to page 1 when filters change
    const page = 1
    setCurrentPage(page)
    fetchOrganizations(page, filters)
  }, [
    filters.search,
    filters.category,
    filters.tech,
    filters.year,
    filters.topic,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters.difficulties),
    fetchOrganizations,
  ])

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || isLoading || page < 1) return
    
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filters.search) params.set('q', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.tech) params.set('tech', filters.tech)
    if (filters.year) params.set('year', filters.year)
    if (filters.topic) params.set('topic', filters.topic)
    if (filters.difficulties.length > 0) params.set('difficulties', filters.difficulties.join(','))
    
    const url = `/organizations?${params.toString()}`
    // Prevent duplicate navigation to same URL
    const currentUrl = window.location.pathname + window.location.search
    if (currentUrl === url) return
    
    // Use startTransition to keep UI responsive during navigation
    startTransition(() => {
      router.push(url, { scroll: false })
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage, filters, isLoading, router])

  const removeFilter = useCallback((key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: key === 'search' ? '' : (key === 'difficulties' ? [] : null) }
    handleFilterChange(newFilters)
  }, [filters, handleFilterChange])

  // Active filters for the "Clear all" button logic
  const hasActiveFilters = filters.year !== null || 
    filters.tech !== null || 
    filters.topic !== null || 
    filters.difficulties.length > 0

  // Sidebar-only filters (those without inline X buttons) to show as chips
  const sidebarFilters = [
    filters.year && { key: 'year' as const, label: `Year: ${filters.year}`, value: filters.year },
    filters.tech && { key: 'tech' as const, label: filters.tech, value: filters.tech },
    filters.topic && { key: 'topic' as const, label: filters.topic, value: filters.topic },
  ].filter(Boolean) as Array<{ key: 'year' | 'tech' | 'topic'; label: string; value: string }>

  // Helper to toggle a difficulty in the array
  const toggleDifficulty = useCallback((difficulty: string) => {
    const newDifficulties = filters.difficulties.includes(difficulty)
      ? filters.difficulties.filter(d => d !== difficulty)
      : [...filters.difficulties, difficulty]
    handleFilterChange({ ...filters, difficulties: newDifficulties })
  }, [filters, handleFilterChange])

  // Check if a difficulty is selected
  const isDifficultySelected = useCallback((difficulty: string) => {
    return filters.difficulties.includes(difficulty)
  }, [filters.difficulties])

  return (
    <div className="flex">
      {/* Sidebar - Fixed left, 280px width */}
      <aside className="hidden lg:block w-[280px] shrink-0 bg-white fixed top-20 lg:top-24 left-4 h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
        <FiltersSidebar onFilterChange={handleFilterChange} filters={filters} />
      </aside>

      {/* Main Content - with left margin for sidebar */}
      <div className="flex-1 lg:ml-[280px]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header Section */}
          {/* <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full mb-3 tracking-wide">
              GSoC 2026
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 italic">
              All Organizations
            </h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Explore all Google Summer of Code participating organizations. Filter by 
              technology, difficulty level, and find the perfect match for your skills and 
              interests.
            </p>
          </div> */}
          <SectionHeader
            badge="GSoC 2026"
            title="All Organizations"
            description="Explore all Google Summer of Code participating organizations. Filter by technology, difficulty level, and find the perfect match for your skills and interests."
            align="center"
            className="max-w-3xl mx-auto mb-8"
          />
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search organizations by name, technology, or keyword..."
              className="pl-10 h-11 text-sm rounded-xl border border-gray-200 bg-white"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Filter Chips Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                !filters.year && !filters.tech && filters.difficulties.length === 0
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({ ...filters, year: null, tech: null, difficulties: [] })}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                isDifficultySelected('Beginner Friendly')
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleDifficulty('Beginner Friendly')}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-500">🌱</span>
                Beginner Friendly
                {isDifficultySelected('Beginner Friendly') && (
                  <X className="h-3.5 w-3.5 ml-0.5" />
                )}
              </span>
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                isDifficultySelected('Intermediate')
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleDifficulty('Intermediate')}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-blue-500">⚡</span>
                Intermediate
                {isDifficultySelected('Intermediate') && (
                  <X className="h-3.5 w-3.5 ml-0.5" />
                )}
              </span>
            </button>
            <button
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                isDifficultySelected('Hard')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleDifficulty('Hard')}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-red-500">🔥</span>
                Hard
                {isDifficultySelected('Hard') && (
                  <X className="h-3.5 w-3.5 ml-0.5" />
                )}
              </span>
            </button>
            {hasActiveFilters && (
              <button
                className="px-2 py-1.5 text-[13px] text-gray-400 hover:text-gray-600"
                onClick={() => handleFilterChange({
                  search: '',
                  year: null,
                  category: null,
                  tech: null,
                  topic: null,
                  difficulties: [],
                })}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sidebar Filters as Chips (for year, tech, topic) */}
          {sidebarFilters.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {sidebarFilters.map((filter) => {
                const handleRemove = () => removeFilter(filter.key)
                return (
                  <span
                    key={filter.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-gray-100 text-gray-700 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={handleRemove}
                  >
                    {filter.label}
                    <X className="h-3.5 w-3.5" />
                  </span>
                )
              })}
            </div>
          )}

          {/* Results Count */}
          {/* <p className="text-sm text-gray-500 mb-6">
            Showing {data.total} organizations
          </p> */}

          {/* Organizations Grid */}
          <div className="mb-8">
            {isLoading ? (
              <OrganizationsGridSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.items.map((org) => (
                  <OrganizationCard key={org.id} org={org} />
                ))}
                {/* Note: Prefetch is fine here - only 20 items per page */}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex flex-col items-center gap-3 py-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="text-sm"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className="min-w-[36px] text-sm"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {data.pages > 7 && <span className="px-2 text-gray-400">...</span>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === data.pages || isLoading}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
              <p className="text-sm text-gray-500">Page {currentPage} of {data.pages}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


function OrganizationsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
