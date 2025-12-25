'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

export interface FilterState {
  search: string
  years: string[]
  categories: string[]
  techs: string[]
  topics: string[]
  difficulties: string[]
  firstTimeOnly: boolean
}

interface FiltersSidebarProps {
  onFilterChange: (filters: FilterState) => void
  filters: FilterState
}

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012]
const CATEGORIES = [
  'Artificial Intelligence',
  'Data',
  'Development tools',
  'End-user applications',
  'Infrastructure & Cloud',
  'Media',
  'Operating systems',
  'Programming languages',
  'Science',
  'Security',
  'Web Development',
]
const TOPICS = [
  'Machine Learning',
  'Web Development', 
  'Security',
  'Cloud',
  'Graphics',
  'Mobile',
  'Database',
]

export function FiltersSidebar({ onFilterChange, filters }: FiltersSidebarProps) {

  const [sidebarSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    firstTime: true,
    years: true,
    technologies: true,
    categories: true,
    topics: true,
  })

  const [techSearch, setTechSearch] = useState('')
  const [availableTechs, setAvailableTechs] = useState<Array<{ name: string; count: number }>>([])
  const [showAllTechs, setShowAllTechs] = useState(false)
  const [showAllYears, setShowAllYears] = useState(false)

  useEffect(() => {
    fetch('/api/tech-stack?limit=100')
      .then((res) => res.json())
      .then((data: { items?: Array<{ name: string; usage_count?: number }> }) => {
        setAvailableTechs(
          (data.items || []).map((item) => ({
            name: item.name,
            count: item.usage_count || 0,
          }))
        )
      })
      .catch(console.error)
  }, [])

  const toggleFirstTime = () => {
    onFilterChange({ ...filters, firstTimeOnly: !filters.firstTimeOnly })
  }

  const toggleYear = (year: string) => {
    const years = filters.years.includes(year)
      ? filters.years.filter((y) => y !== year)
      : [...filters.years, year]
    onFilterChange({ ...filters, years })
  }

  const toggleCategory = (category: string) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFilterChange({ ...filters, categories })
  }

  const toggleTech = (tech: string) => {
    const techs = filters.techs.includes(tech)
      ? filters.techs.filter((t) => t !== tech)
      : [...filters.techs, tech]
    onFilterChange({ ...filters, techs })
  }

  const toggleTopic = (topic: string) => {
    const topics = filters.topics.includes(topic)
      ? filters.topics.filter((t) => t !== topic)
      : [...filters.topics, topic]
    onFilterChange({ ...filters, topics })
  }

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      years: [],
      categories: [],
      techs: [],
      topics: [],
      difficulties: [],
      firstTimeOnly: false,
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const hasActiveFilters = filters.search !== '' ||
    filters.years.length > 0 ||
    filters.categories.length > 0 ||
    filters.techs.length > 0 ||
    filters.topics.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.firstTimeOnly

  const filteredTechs = availableTechs.filter((tech) =>
    tech.name.toLowerCase().includes(techSearch.toLowerCase())
  )

  // Filter sidebar options based on sidebar search
  const filteredCategories = CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(sidebarSearch.toLowerCase())
  )
  const filteredTopics = TOPICS.filter((topic) =>
    topic.toLowerCase().includes(sidebarSearch.toLowerCase())
  )

  const visibleYears = showAllYears ? YEARS : YEARS.slice(0, 8)
  const visibleTechs = showAllTechs ? filteredTechs : filteredTechs.slice(0, 10)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 pb-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button 
            onClick={clearAllFilters} 
            className="text-[13px] text-gray-500 hover:text-gray-700 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sidebar Search - filters sidebar options only */}
      {/* <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search…"
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
        />
      </div> */}

      {/* Shortcuts Section */}
      <div className="mb-4">
      <div className="pl-1 py-2">
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                checked={filters.firstTimeOnly}
                onChange={toggleFirstTime}
              />
              <span className="text-sm text-gray-700">First-time organizations</span>
              <span className="text-xs text-gray-400">(14)</span>
            </label>
          </div>
      </div>

      {/* Years Section */}
      <div className="mb-4 border-t border-gray-100 pt-3">
        <button
          onClick={() => toggleSection('years')}
          className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-900"
        >
          <span>Years</span>
          {expandedSections.years ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.years && (
          <div className="py-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {visibleYears.map((year) => (
                <label key={year} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={filters.years.includes(year.toString())}
                    onChange={() => toggleYear(year.toString())}
                  />
                  <span className="text-[13px] text-gray-700">{year}</span>
                </label>
              ))}
            </div>
            {YEARS.length > 8 && (
              <button
                onClick={() => setShowAllYears(!showAllYears)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showAllYears ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    View all
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Technologies Section */}
      <div className="border-t border-gray-100 pt-3">
        <button
          onClick={() => toggleSection('technologies')}
          className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-900"
        >
          <span>Technologies</span>
          {expandedSections.technologies ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.technologies && (
          <div className="py-2">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search technologies..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200"
              />
            </div>
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {visibleTechs.map((tech) => (
                <label key={tech.name} className="flex items-center justify-between py-1.5 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      checked={filters.techs.includes(tech.name)}
                      onChange={() => toggleTech(tech.name)}
                    />
                    <span className="text-[13px] text-gray-700">{tech.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">({tech.count})</span>
                </label>
              ))}
            </div>
            {filteredTechs.length > 10 && (
              <button
                onClick={() => setShowAllTechs(!showAllTechs)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showAllTechs ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    View all
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Categories Section */}
      <div className="mb-4 border-t border-gray-100 pt-3">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-900"
        >
          <span>Categories</span>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="py-2">
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {filteredCategories.map((category) => (
                <label key={category} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className="text-[13px] text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topics Section */}
      <div className="mb-4 border-t border-gray-100 pt-3">
        <button
          onClick={() => toggleSection('topics')}
          className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-900"
        >
          <span>Topics</span>
          {expandedSections.topics ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.topics && (
          <div className="py-2">
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {filteredTopics.map((topic) => (
                <label key={topic} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={filters.topics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                  />
                  <span className="text-[13px] text-gray-700">{topic}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      
    </div>
  )
}
