'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button, Input, SectionHeader } from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'
import { OrganizationCard } from '@/components/organization-card'
import { FiltersSidebar, FilterState } from './filters-sidebar'

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((val, idx) => val === b[idx])

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
  
  // Memoize filters from URL using primitives to avoid unnecessary recalculations
  const urlFilters = useMemo<FilterState>(() => {
    const urlSearch = searchParams.get('q') || ''
    const urlYears = searchParams.get('years')?.split(',').filter(Boolean) || []
    const urlCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const urlTechs = searchParams.get('techs')?.split(',').filter(Boolean) || []
    const urlTopics = searchParams.get('topics')?.split(',').filter(Boolean) || []
    const urlDifficulties = searchParams.get('difficulties') || ''
    const urlFirstTimeOnly = searchParams.get('firstTimeOnly') === 'true'

    return {
      search: urlSearch,
      years: urlYears,
      categories: urlCategories,
      techs: urlTechs,
      topics: urlTopics,
      difficulties: urlDifficulties ? urlDifficulties.split(',').filter(Boolean) : [],
      firstTimeOnly: urlFirstTimeOnly,
    }
  }, [searchParams])
  
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
      !arraysEqual(filters.years, urlFilters.years) ||
      !arraysEqual(filters.categories, urlFilters.categories) ||
      !arraysEqual(filters.techs, urlFilters.techs) ||
      !arraysEqual(filters.topics, urlFilters.topics) ||
      !arraysEqual(filters.difficulties, urlFilters.difficulties) ||
      filters.firstTimeOnly !== urlFilters.firstTimeOnly
    
    if (filtersChanged) {
      setFilters(urlFilters)
      setSearchInput(urlFilters.search)
    }
  }, [urlFilters, searchParams, filters])
  
  // handleFilterChange must be declared before useEffect that uses it
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    // Prevent unnecessary updates if filters haven't changed
    const filtersChanged = 
      filters.search !== newFilters.search ||
      !arraysEqual(filters.years, newFilters.years) ||
      !arraysEqual(filters.categories, newFilters.categories) ||
      !arraysEqual(filters.techs, newFilters.techs) ||
      !arraysEqual(filters.topics, newFilters.topics) ||
      !arraysEqual(filters.difficulties, newFilters.difficulties) ||
      filters.firstTimeOnly !== newFilters.firstTimeOnly
    
    if (!filtersChanged) return
    
    // Build URL params first
    const params = new URLSearchParams()
    // Reset to page 1 when filters change
    if (newFilters.search) params.set('q', newFilters.search)
    if (newFilters.years.length > 0) params.set('years', newFilters.years.join(','))
    if (newFilters.categories.length > 0) params.set('categories', newFilters.categories.join(','))
    if (newFilters.techs.length > 0) params.set('techs', newFilters.techs.join(','))
    if (newFilters.topics.length > 0) params.set('topics', newFilters.topics.join(','))
    if (newFilters.difficulties.length > 0) params.set('difficulties', newFilters.difficulties.join(','))
    if (newFilters.firstTimeOnly) params.set('firstTimeOnly', 'true')
    
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
      if (filterState.years.length > 0) params.set('years', filterState.years.join(','))
      if (filterState.categories.length > 0) params.set('categories', filterState.categories.join(','))
      if (filterState.techs.length > 0) params.set('techs', filterState.techs.join(','))
      if (filterState.topics.length > 0) params.set('topics', filterState.topics.join(','))
      if (filterState.difficulties.length > 0) params.set('difficulties', filterState.difficulties.join(','))
      if (filterState.firstTimeOnly) params.set('firstTimeOnly', 'true')
      
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
    filters.years,
    filters.categories,
    filters.techs,
    filters.topics,
    filters.firstTimeOnly,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters.difficulties),
    fetchOrganizations,
  ])

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || isLoading || page < 1) return
    
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filters.search) params.set('q', filters.search)
    if (filters.years.length > 0) params.set('years', filters.years.join(','))
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
    if (filters.techs.length > 0) params.set('techs', filters.techs.join(','))
    if (filters.topics.length > 0) params.set('topics', filters.topics.join(','))
    if (filters.difficulties.length > 0) params.set('difficulties', filters.difficulties.join(','))
    if (filters.firstTimeOnly) params.set('firstTimeOnly', 'true')
    
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

  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    const newFilters = { ...filters }
    if (key === 'search') {
      newFilters.search = ''
    } else if (key === 'firstTimeOnly') {
      newFilters.firstTimeOnly = false
    } else if (Array.isArray(filters[key])) {
      const existing = filters[key] as string[]
      const updated = value ? existing.filter((v) => v !== value) : []
      newFilters[key] = updated as FilterState[typeof key]
    }
    handleFilterChange(newFilters)
  }, [filters, handleFilterChange])

  // Active filters for the "Clear all" button logic
  const hasActiveFilters = filters.years.length > 0 ||
    filters.techs.length > 0 ||
    filters.topics.length > 0 ||
    filters.categories.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.firstTimeOnly

  // Sidebar-only filters (those without inline X buttons) to show as chips
  const sidebarFilters = [
    ...filters.years.map((year: string) => ({ key: 'years' as const, label: `Year: ${year}`, value: year })),
    ...filters.techs.map((tech: string) => ({ key: 'techs' as const, label: tech, value: tech })),
    ...filters.topics.map((topic: string) => ({ key: 'topics' as const, label: topic, value: topic })),
    ...filters.categories.map((cat: string) => ({ key: 'categories' as const, label: cat, value: cat })),
    filters.firstTimeOnly ? { key: 'firstTimeOnly' as const, label: 'First-time orgs', value: 'true' } : null,
  ].filter(Boolean) as Array<{ key: 'years' | 'techs' | 'topics' | 'categories' | 'firstTimeOnly'; label: string; value: string }>

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
                !hasActiveFilters && filters.difficulties.length === 0 && !filters.search
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleFilterChange({
                ...filters,
                years: [],
                categories: [],
                techs: [],
                topics: [],
                difficulties: [],
                firstTimeOnly: false,
              })}
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
                  years: [],
                  categories: [],
                  techs: [],
                  topics: [],
                  difficulties: [],
                  firstTimeOnly: false,
                })}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sidebar Filters as Chips (for year, tech, topic) */}
          {sidebarFilters.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {sidebarFilters.map((filter) => (
                <span
                  key={`${filter.key}-${filter.value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-gray-100 text-gray-700 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => removeFilter(filter.key, filter.value)}
                >
                  {filter.label}
                  <X className="h-3.5 w-3.5" />
                </span>
              ))}
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
