'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import {
  Grid,
  CardWrapper,
  Heading,
  Text,
  Badge,
  Button,
  Input,
} from '@/components/ui'
import { Organization, PaginatedResponse } from '@/lib/api'
import { FiltersSidebar, FilterState } from './filters-sidebar'

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
  
  // Filter state from URL
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || '',
    year: searchParams.get('year') || null,
    category: searchParams.get('category') || null,
    tech: searchParams.get('tech') || null,
    topic: searchParams.get('topic') || null,
    difficulty: searchParams.get('difficulty') || null,
  })

  // Update filters from URL params
  useEffect(() => {
    const newFilters: FilterState = {
      search: searchParams.get('q') || '',
      year: searchParams.get('year') || null,
      category: searchParams.get('category') || null,
      tech: searchParams.get('tech') || null,
      topic: searchParams.get('topic') || null,
      difficulty: searchParams.get('difficulty') || null,
    }
    setFilters(newFilters)
  }, [searchParams])

  // Update when URL params change
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1
    if (page !== currentPage) {
      setCurrentPage(page)
      fetchOrganizations(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchOrganizations = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      
      // Add filter params
      if (filters.search) params.set('q', filters.search)
      if (filters.category) params.set('category', filters.category)
      if (filters.tech) params.set('tech', filters.tech)
      if (filters.year) params.set('year', filters.year)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.topic) params.set('topic', filters.topic)
      
      const response = await fetch(`/api/organizations?${params.toString()}`)
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Refetch when filters change
  useEffect(() => {
    fetchOrganizations(1)
    setCurrentPage(1)
  }, [filters, fetchOrganizations])

  const handlePageChange = (page: number) => {
    updateURLParams({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    updateURLParams({ ...newFilters, page: 1 })
  }

  const updateURLParams = (updates: Partial<FilterState> & { page?: number }) => {
    const params = new URLSearchParams()
    
    // Add page
    const page = updates.page || currentPage
    if (page > 1) params.set('page', page.toString())
    
    // Add filters
    const filterUpdates = updates as Partial<FilterState>
    if (filterUpdates.search) params.set('q', filterUpdates.search)
    if (filterUpdates.category) params.set('category', filterUpdates.category)
    if (filterUpdates.tech) params.set('tech', filterUpdates.tech)
    if (filterUpdates.year) params.set('year', filterUpdates.year)
    if (filterUpdates.topic) params.set('topic', filterUpdates.topic)
    if (filterUpdates.difficulty) params.set('difficulty', filterUpdates.difficulty)
    
    router.push(`/organizations?${params.toString()}`)
  }

  const handleQuickFilter = (type: 'tech' | 'category', value: string) => {
    const newFilters = { ...filters, [type]: filters[type] === value ? null : value }
    handleFilterChange(newFilters)
  }

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: key === 'search' ? '' : null }
    handleFilterChange(newFilters)
  }

  const activeFilters = [
    filters.year && { key: 'year', label: filters.year, value: filters.year },
    filters.category && { key: 'category', label: filters.category, value: filters.category },
    filters.tech && { key: 'tech', label: filters.tech, value: filters.tech },
    filters.topic && { key: 'topic', label: filters.topic, value: filters.topic },
    filters.difficulty && { key: 'difficulty', label: filters.difficulty, value: filters.difficulty },
  ].filter(Boolean) as Array<{ key: keyof FilterState; label: string; value: string }>

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="hidden lg:block">
        <FiltersSidebar onFilterChange={handleFilterChange} initialFilters={filters} />
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* SEO content - only show on page 1 */}
        {currentPage === 1 && !filters.search && !filters.tech && !filters.category && (
          <div className="max-w-3xl mx-auto mb-12 prose prose-gray dark:prose-invert">
            <p className="text-lg text-muted-foreground text-center">
              Browse through all Google Summer of Code participating organizations. 
              Discover the perfect open-source project that matches your skills and interests. 
              Our comprehensive directory includes organizations working on Python, JavaScript, 
              Machine Learning, Web Development, and many other technologies. Filter by your 
              preferred tech stack and difficulty level to find beginner-friendly projects or 
              advanced challenges.
            </p>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="space-y-6 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations by name, technology, or keyword..."
              className="pl-10 h-12 text-base"
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant={!filters.tech && !filters.category ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleFilterChange({ ...filters, tech: null, category: null })}
            >
              All
            </Badge>
            <Badge
              variant={filters.tech === 'Python' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleQuickFilter('tech', 'Python')}
            >
              Python
            </Badge>
            <Badge
              variant={filters.tech === 'JavaScript' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleQuickFilter('tech', 'JavaScript')}
            >
              JavaScript
            </Badge>
            <Badge
              variant={filters.difficulty === 'Beginner Friendly' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => {
                const newFilters = {
                  ...filters,
                  difficulty: filters.difficulty === 'Beginner Friendly' ? null : 'Beginner Friendly',
                }
                handleFilterChange(newFilters)
              }}
            >
              Beginner Friendly
            </Badge>
            <Badge
              variant={filters.category === 'Artificial Intelligence' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleQuickFilter('category', 'Artificial Intelligence')}
            >
              Machine Learning
            </Badge>
            <Badge
              variant={filters.category === 'Web Development' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleQuickFilter('category', 'Web Development')}
            >
              Web Development
            </Badge>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => removeFilter(filter.key)}
                >
                  {filter.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange({
                  search: '',
                  year: null,
                  category: null,
                  tech: null,
                  topic: null,
                  difficulty: null,
                })}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

      {/* Organizations Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <OrganizationsGridSkeleton />
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {data.items.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </Grid>
        )}
      </div>

      {/* Pagination Controls */}
      {data.pages > 1 && (
        <div className="flex flex-col items-center gap-6 pt-8">
          {/* Page Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(data.pages, 10) }, (_, i) => {
              // Show first 3, current page ± 2, and last 3 pages
              const pageNum = i + 1
              const shouldShow =
                pageNum <= 3 ||
                pageNum >= data.pages - 2 ||
                Math.abs(pageNum - currentPage) <= 2

              if (!shouldShow) {
                if (pageNum === 4 || pageNum === data.pages - 3) {
                  return <span key={i} className="px-2">...</span>
                }
                return null
              }

              return (
                <Button
                  key={i}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              )
            })}

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === data.pages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

/**
 * Organization Card Component
 */
interface OrganizationCardProps {
  org: Organization
}

function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <CardWrapper hover className="h-full flex flex-col">
      {/* Organization Logo/Icon */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {org.img_r2_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.img_r2_url}
              alt={`${org.name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <Heading variant="small" className="line-clamp-1">
            {org.name}
          </Heading>
          <Text variant="small" className="text-muted-foreground">
            {org.total_projects} projects
          </Text>
        </div>
      </div>

      {/* Description */}
      <Text variant="muted" className="line-clamp-3 mb-4 flex-1">
        {org.description}
      </Text>

      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {org.technologies.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
        {org.technologies.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{org.technologies.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Badge variant={org.is_currently_active ? 'default' : 'secondary'}>
          {org.is_currently_active ? 'Active' : 'Inactive'}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/organizations/${org.slug}`}>View Details →</a>
        </Button>
      </div>
    </CardWrapper>
  )
}

/**
 * Loading Skeleton for Organizations Grid
 */
function OrganizationsGridSkeleton() {
  return (
    <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardWrapper key={i} className="h-64 animate-pulse">
          <div className="h-full bg-muted/50 rounded-md" />
        </CardWrapper>
      ))}
    </Grid>
  )
}

