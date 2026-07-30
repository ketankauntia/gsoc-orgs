'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'
import { OrganizationCard } from '@/components/organization-card'
import { FiltersSidebar, FilterState } from './filters-sidebar'
import { useDebouncedSearch } from '@/hooks'
import { MobileFiltersDialog } from './mobile-filters-dialog'

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((val, idx) => val === b[idx])

interface OrganizationsClientProps {
  initialData: PaginatedResponse<Organization>
  initialPage: number
  initialTechs: Array<{ name: string; count: number }>
  firstTimeCount?: number
}

export function OrganizationsClient({ initialData, initialPage, initialTechs, firstTimeCount }: OrganizationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<Organization>>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const isInitialMount = useRef(true)
  const lastFetchParams = useRef<string>('')
  const lastUrlString = useRef<string>('')
  const sortBy = searchParams.get('sort') || 'name'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Sync server-rendered data when initialData/initialPage change after navigation.
  // Without this, router.push() re-renders on the server but the client keeps stale state.
  useEffect(() => {
    setData(initialData)
    setCurrentPage(initialPage)
    setIsLoading(false)
  }, [initialData, initialPage])
  
  // Memoize filters from URL using primitives to avoid unnecessary recalculations
  const urlFilters = useMemo<FilterState>(() => {
    const urlSearch = searchParams.get('q') || ''
    const urlYears = searchParams.get('years')?.split(',').filter(Boolean) || []
    const urlCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const urlTechs = searchParams.get('techs')?.split(',').filter(Boolean) || []
    const urlTopics = searchParams.get('topics')?.split(',').filter(Boolean) || []
    const urlDifficulties = searchParams.get('difficulties') || ''
    const urlFirstTimeOnly = searchParams.get('firstTimeOnly') === 'true'
    const urlYearsLogic = (searchParams.get('yearsLogic') as 'AND' | 'OR') || 'OR'
    const urlCategoriesLogic = (searchParams.get('categoriesLogic') as 'AND' | 'OR') || 'OR'
    const urlTechsLogic = (searchParams.get('techsLogic') as 'AND' | 'OR') || 'OR'
    const urlTopicsLogic = (searchParams.get('topicsLogic') as 'AND' | 'OR') || 'OR'

    return {
      search: urlSearch,
      years: urlYears,
      categories: urlCategories,
      techs: urlTechs,
      topics: urlTopics,
      difficulties: urlDifficulties ? urlDifficulties.split(',').filter(Boolean) : [],
      firstTimeOnly: urlFirstTimeOnly,
      yearsLogic: urlYearsLogic,
      categoriesLogic: urlCategoriesLogic,
      techsLogic: urlTechsLogic,
      topicsLogic: urlTopicsLogic,
    }
  }, [searchParams])
  
  const [filters, setFilters] = useState<FilterState>(urlFilters)
  const [searchInput, setSearchInput] = useState(urlFilters.search)
  
  // Debounce search input to avoid excessive navigation
  const debouncedSearch = useDebouncedSearch(searchInput, 300)

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
      filters.firstTimeOnly !== newFilters.firstTimeOnly ||
      filters.yearsLogic !== newFilters.yearsLogic ||
      filters.categoriesLogic !== newFilters.categoriesLogic ||
      filters.techsLogic !== newFilters.techsLogic ||
      filters.topicsLogic !== newFilters.topicsLogic
    
    if (!filtersChanged) return
    
    // Build URL params first
    const params = new URLSearchParams()
    // Reset to page 1 when filters change
    if (newFilters.search) params.set('q', newFilters.search)
    if (newFilters.years.length > 0) {
      params.set('years', newFilters.years.join(','))
      params.set('yearsLogic', newFilters.yearsLogic || 'OR')
    }
    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','))
      params.set('categoriesLogic', newFilters.categoriesLogic || 'OR')
    }
    if (newFilters.techs.length > 0) {
      params.set('techs', newFilters.techs.join(','))
      params.set('techsLogic', newFilters.techsLogic || 'OR')
    }
    if (newFilters.topics.length > 0) {
      params.set('topics', newFilters.topics.join(','))
      params.set('topicsLogic', newFilters.topicsLogic || 'OR')
    }
    if (newFilters.difficulties.length > 0) params.set('difficulties', newFilters.difficulties.join(','))
    if (newFilters.firstTimeOnly) params.set('firstTimeOnly', 'true')
    if (sortBy !== 'name') params.set('sort', sortBy)
    
    const newUrl = `/organizations?${params.toString()}`
    
    // Update state and navigate - use startTransition to keep UI responsive
    setFilters(newFilters)
    // Use startTransition to make navigation non-blocking (especially helpful on low-end devices)
    startTransition(() => {
      router.push(newUrl, { scroll: false })
    })
  }, [filters, router, sortBy])
  
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
      if (sortBy !== 'name') params.set('sort', sortBy)
      if (filterState.search) params.set('q', filterState.search)
      if (filterState.years.length > 0) {
        params.set('years', filterState.years.join(','))
        params.set('yearsLogic', filterState.yearsLogic || 'OR')
      }
      if (filterState.categories.length > 0) {
        params.set('categories', filterState.categories.join(','))
        params.set('categoriesLogic', filterState.categoriesLogic || 'OR')
      }
      if (filterState.techs.length > 0) {
        params.set('techs', filterState.techs.join(','))
        params.set('techsLogic', filterState.techsLogic || 'OR')
      }
      if (filterState.topics.length > 0) {
        params.set('topics', filterState.topics.join(','))
        params.set('topicsLogic', filterState.topicsLogic || 'OR')
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch organizations:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [sortBy])

  // Page changes are handled via router.push() → server re-render → initialData sync.
  // No client-side fetch needed for pagination.

  // Filters and search are handled server-side via router.push() → server re-render → initialData sync.
  // Only need client-side API fetch for AND logic filters (rare edge case).
  useEffect(() => {
    if (isInitialMount.current) {
      return
    }
    
    const needsAPI = 
      filters.yearsLogic === 'AND' ||
      filters.categoriesLogic === 'AND' ||
      filters.techsLogic === 'AND' ||
      filters.topicsLogic === 'AND'
    
    if (!needsAPI) {
      return
    }
    
    const page = 1
    setCurrentPage(page)
    fetchOrganizations(page, filters)
  }, [
    filters,
    fetchOrganizations,
  ])

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || isLoading || page < 1) return
    
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filters.search) params.set('q', filters.search)
    if (filters.years.length > 0) {
      params.set('years', filters.years.join(','))
      params.set('yearsLogic', filters.yearsLogic || 'OR')
    }
    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','))
      params.set('categoriesLogic', filters.categoriesLogic || 'OR')
    }
    if (filters.techs.length > 0) {
      params.set('techs', filters.techs.join(','))
      params.set('techsLogic', filters.techsLogic || 'OR')
    }
    if (filters.topics.length > 0) {
      params.set('topics', filters.topics.join(','))
      params.set('topicsLogic', filters.topicsLogic || 'OR')
    }
    if (filters.difficulties.length > 0) params.set('difficulties', filters.difficulties.join(','))
    if (filters.firstTimeOnly) params.set('firstTimeOnly', 'true')
    if (sortBy !== 'name') params.set('sort', sortBy)
    
    const url = `/organizations?${params.toString()}`
    // Prevent duplicate navigation to same URL
    const currentUrl = window.location.pathname + window.location.search
    if (currentUrl === url) return
    
    // Use startTransition to keep UI responsive during navigation
    startTransition(() => {
      router.push(url, { scroll: false })
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage, filters, isLoading, router, sortBy])

  const handleSortChange = useCallback((sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (sort === 'name') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }

    startTransition(() => {
      router.push(`/organizations?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    const newFilters: FilterState = { ...filters }
    if (key === 'search') {
      newFilters.search = ''
    } else if (key === 'firstTimeOnly') {
      newFilters.firstTimeOnly = false
    } else if (key === 'years') {
      newFilters.years = value ? filters.years.filter((v) => v !== value) : []
    } else if (key === 'categories') {
      newFilters.categories = value ? filters.categories.filter((v) => v !== value) : []
    } else if (key === 'techs') {
      newFilters.techs = value ? filters.techs.filter((v) => v !== value) : []
    } else if (key === 'topics') {
      newFilters.topics = value ? filters.topics.filter((v) => v !== value) : []
    } else if (key === 'difficulties') {
      newFilters.difficulties = value ? filters.difficulties.filter((v) => v !== value) : []
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

  const activeFilterCount = filters.years.length +
    filters.techs.length +
    filters.topics.length +
    filters.categories.length +
    filters.difficulties.length +
    (filters.firstTimeOnly ? 1 : 0)

  // Sidebar-only filters (those without inline X buttons) to show as chips
  const sidebarFilters = [
    ...filters.years.map((year: string) => ({ key: 'years' as const, label: `Year: ${year}`, value: year })),
    ...filters.techs.map((tech: string) => ({ key: 'techs' as const, label: tech, value: tech })),
    ...filters.topics.map((topic: string) => ({ key: 'topics' as const, label: topic, value: topic })),
    ...filters.categories.map((cat: string) => ({ key: 'categories' as const, label: cat, value: cat })),
    filters.firstTimeOnly ? { key: 'firstTimeOnly' as const, label: 'First-time orgs', value: 'true' } : null,
  ].filter((item): item is { key: 'years' | 'techs' | 'topics' | 'categories' | 'firstTimeOnly'; label: string; value: string } => item !== null)


  return (
    <div className="mx-auto flex w-full max-w-[90rem] gap-6 px-4 pb-20 sm:px-6 lg:px-8">
      {/* Persistent desktop filter rail */}
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-[280px] shrink-0 self-start overflow-y-auto pb-4 custom-scrollbar lg:block">
        <FiltersSidebar onFilterChange={handleFilterChange} filters={filters} availableTechs={initialTechs} firstTimeCount={firstTimeCount} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl py-4 lg:py-8">
          {/* Header Section */}
          <div className="atlas-grid overflow-hidden rounded-2xl bg-ink px-6 py-9 text-[#f5eee9] sm:px-9 sm:py-11">
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
              Organization explorer · archive snapshot
            </p>
            <h1 className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.055em] text-balance">
              Find an organization worth researching.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#aaa29d]">
              Filter recorded organizations by participation year, technology,
              topic, and category. Then validate the fit using projects and
              official community links.
            </p>
          </div>
          {/* Search Bar */}
          <div className="relative mx-auto -mt-5 mb-5 w-[calc(100%-2rem)] max-w-3xl">
            <Search className="absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations, technologies, topics, or keywords"
              aria-label="Search organizations"
              className="h-14 rounded-xl border-border bg-card pl-12 pr-4 text-base shadow-[0_12px_35px_rgb(23_22_21/0.12)]"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="mb-5 flex justify-center lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-36"
              onClick={() => setMobileFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>

          {/* Filter Chips Row */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`min-h-9 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-[background-color,border-color,color] ${
                !hasActiveFilters && filters.difficulties.length === 0 && !filters.search
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
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
            {/* Difficulty filters - Coming soon */}
            {false && (
              <>
            <button
              disabled
              className="px-3 py-1.5 text-[13px] font-medium rounded-full border bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60 relative group"
              title="Coming soon"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-500">🌱</span>
                Beginner Friendly
              </span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming soon
              </span>
            </button>
            <button
              disabled
              className="px-3 py-1.5 text-[13px] font-medium rounded-full border border bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60 relative group"
              title="Coming soon"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-blue-500">⚡</span>
                Intermediate
              </span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming soon
              </span>
            </button>
            <button
              disabled
              className="px-3 py-1.5 text-[13px] font-medium rounded-full border border bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60 relative group"
              title="Coming soon"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-red-500">🔥</span>
                Hard
              </span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming soon
              </span>
            </button>
              </>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                className="min-h-9 px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
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
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {sidebarFilters.map((filter) => (
                <button
                  type="button"
                  key={`${filter.key}-${filter.value}`}
                  aria-label={`Remove ${filter.label} filter`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-[13px] text-foreground transition-[background-color,border-color] hover:border-foreground/25 hover:bg-card"
                  onClick={() => removeFilter(filter.key, filter.value)}
                >
                  {filter.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-data text-xs text-muted-foreground" aria-live="polite">
              {data.total.toLocaleString()} organization{data.total === 1 ? '' : 's'}
            </p>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => handleSortChange(event.target.value)}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-[0_1px_0_rgb(23_22_21/0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label="Sort organizations"
              >
                <option value="name">Name, A to Z</option>
                <option value="projects">Most projects</option>
                <option value="recent">Most recently active</option>
              </select>
            </label>
          </div>

          {/* Organizations Grid */}
          <div className="mb-8">
            {isLoading ? (
              <OrganizationsGridSkeleton />
            ) : data.items.length === 0 ? (
              <div className="atlas-corner-marks flex min-h-80 flex-col items-center justify-center border border-border bg-card p-8 text-center text-muted-foreground">
                <Search className="size-7 text-accent-foreground" strokeWidth={1.5} />
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-foreground">
                  No organizations match this research path.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6">
                  Remove a filter or broaden the search. Your current filters
                  stay visible above so the result is easy to recover.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6"
                  onClick={() =>
                    handleFilterChange({
                      search: '',
                      years: [],
                      categories: [],
                      techs: [],
                      topics: [],
                      difficulties: [],
                      firstTimeOnly: false,
                    })
                  }
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-4">
                {data.items.map((org) => (
                  <OrganizationCard key={org.id} org={org} />
                ))}
                {/* Note: Prefetch is fine here - only 20 items per page */}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border py-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="text-sm"
              >
                Previous
              </Button>
              
              {/* First few pages */}
              {(() => {
                const pages: (number | string)[] = []
                const showFirst = 2
                const showLast = 2
                const showAround = 2
                
                // Always show first page
                if (currentPage > showFirst + showAround + 1) {
                  pages.push(1)
                  if (currentPage > showFirst + showAround + 2) {
                    pages.push('...')
                  }
                } else {
                  // Show first few pages
                  for (let i = 1; i <= Math.min(showFirst + showAround + 1, data.pages); i++) {
                    pages.push(i)
                  }
                }
                
                // Show pages around current
                if (currentPage > showFirst + showAround + 1 && currentPage < data.pages - showLast - showAround) {
                  for (let i = currentPage - showAround; i <= currentPage + showAround; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i)
                    }
                  }
                }
                
                // Show last few pages
                if (currentPage < data.pages - showLast - showAround) {
                  if (currentPage < data.pages - showLast - showAround - 1) {
                    pages.push('...')
                  }
                  for (let i = Math.max(data.pages - showLast + 1, currentPage + showAround + 1); i <= data.pages; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i)
                    }
                  }
                } else {
                  // Show last few pages
                  const start = Math.max(1, data.pages - showLast - showAround)
                  for (let i = start; i <= data.pages; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i)
                    }
                  }
                }
                
                return pages.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    )
                  }
                  const pageNum = page as number
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
                })
              })()}
              
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
          )}
        </div>
      </div>
      {mobileFiltersOpen && (
        <MobileFiltersDialog
          appliedCount={activeFilterCount}
          availableTechs={initialTechs}
          filters={filters}
          firstTimeCount={firstTimeCount}
          onClose={() => setMobileFiltersOpen(false)}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  )
}


function OrganizationsGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="min-h-[21rem] animate-pulse rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4 mb-3">
            <div className="size-12 rounded-xl bg-muted" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
