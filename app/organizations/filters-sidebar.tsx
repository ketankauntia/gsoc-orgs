'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react'

export interface FilterState {
  search: string
  years: string[]
  categories: string[]
  techs: string[]
  topics: string[]
  difficulties: string[]
  firstTimeOnly: boolean
  // Logic modes: 'AND' means all selected values must match, 'OR' means any selected value matches
  yearsLogic?: 'AND' | 'OR'
  categoriesLogic?: 'AND' | 'OR'
  techsLogic?: 'AND' | 'OR'
  topicsLogic?: 'AND' | 'OR'
}

interface FiltersSidebarProps {
  onFilterChange: (filters: FilterState) => void
  filters: FilterState
  availableTechs: Array<{ name: string; count: number }>
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

export function FiltersSidebar({ onFilterChange, filters, availableTechs }: FiltersSidebarProps) {

  const [sidebarSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    firstTime: true,
    years: true,
    technologies: true,
    categories: true,
    topics: true,
  })

  // Local state for tech search within sidebar
  const [techSearch, setTechSearch] = useState('')
  const [showAllTechs, setShowAllTechs] = useState(false)
  const [showAllYears, setShowAllYears] = useState(false)
  const [showHelp, setShowHelp] = useState<{ [key: string]: boolean }>({})
  const helpButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [tooltipPosition, setTooltipPosition] = useState<{ [key: string]: { top: number; right: number } }>({})

  // Check if component is mounted (client-side only)
  const mounted = typeof window !== 'undefined'

  // Close tooltip when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside all help buttons and tooltips
      if (
        !target.closest('[data-help-button]') &&
        !target.closest('[data-tooltip]')
      ) {
        setShowHelp({})
      }
    }

    if (Object.values(showHelp).some(Boolean)) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showHelp])

  // NO API CALL - availableTechs potentially passed from parent
  // We used to fetch /api/tech-stack here

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
      yearsLogic: 'OR',
      categoriesLogic: 'OR',
      techsLogic: 'OR',
      topicsLogic: 'OR',
    })
  }

  const toggleLogic = (category: 'years' | 'categories' | 'techs' | 'topics') => {
    const currentLogic = filters[`${category}Logic`] || 'OR'
    const newLogic = currentLogic === 'OR' ? 'AND' : 'OR'
    onFilterChange({
      ...filters,
      [`${category}Logic`]: newLogic,
    })
  }

  const getLogicMode = (category: 'years' | 'categories' | 'techs' | 'topics'): 'AND' | 'OR' => {
    return filters[`${category}Logic`] || 'OR'
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
    <div className="rounded-xl border border-border bg-card p-4 pb-6 shadow-md max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-foreground">Filters</h3>
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
              className="w-4 h-4 rounded border-border text-teal-600 bg-muted dark:text-foreground/80 focus:ring-teal-500"
              checked={filters.firstTimeOnly}
              onChange={toggleFirstTime}
            />
            <span className="text-sm text-gray-700 dark:text-foreground">First-time organizations only</span>
            <span className="text-xs text-gray-400">(14)</span>
          </label>
        </div>
      </div>      

      {/* Years Section */}
      <div className="mb-4 border-t border-border pt-3">
        <div className="flex items-center justify-between w-full py-2">
          <button
            onClick={() => toggleSection('years')}
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <span>Years</span>
            {expandedSections.years ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                ref={(el) => { helpButtonRefs.current.years = el }}
                data-help-button
                onClick={(e) => {
                  e.stopPropagation()
                  if (helpButtonRefs.current.years) {
                    const rect = helpButtonRefs.current.years.getBoundingClientRect()
                    setTooltipPosition({
                      ...tooltipPosition,
                      years: { top: rect.top, right: rect.right }
                    })
                  }
                  setShowHelp({ ...showHelp, years: !showHelp.years })
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="What does AND/OR mean?"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {mounted && showHelp.years && tooltipPosition.years && createPortal(
                <div
                  data-tooltip
                  className="fixed z-[9999] w-56 p-2.5 bg-gray-900 text-white text-xs rounded shadow-lg"
                  style={{
                    top: `${tooltipPosition.years.top}px`,
                    left: `${tooltipPosition.years.right + 8}px`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHelp({ ...showHelp, years: false })
                    }}
                    className="absolute top-1 right-1 p-0.5 hover:bg-gray-700 rounded"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mb-1.5 pr-5"><strong>AND:</strong> Organization must have participated in ALL selected years</p>
                  <p className="pr-5"><strong>OR:</strong> Organization must have participated in ANY selected year</p>
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
              )}
            </div>
            <div className="flex items-center gap-1 border border-border rounded">
              <button
                onClick={() => toggleLogic('years')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('years') === 'AND'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                AND
              </button>
              <button
                onClick={() => toggleLogic('years')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('years') === 'OR'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                OR
              </button>
            </div>
          </div>
        </div>
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
                  <span className="text-[13px] text-foreground/80">{year}</span>
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
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between w-full py-2">
          <button
            onClick={() => toggleSection('technologies')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <span>Technologies</span>
            {expandedSections.technologies ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                ref={(el) => { helpButtonRefs.current.technologies = el }}
                data-help-button
                onClick={(e) => {
                  e.stopPropagation()
                  if (helpButtonRefs.current.technologies) {
                    const rect = helpButtonRefs.current.technologies.getBoundingClientRect()
                    setTooltipPosition({
                      ...tooltipPosition,
                      technologies: { top: rect.top, right: rect.right }
                    })
                  }
                  setShowHelp({ ...showHelp, technologies: !showHelp.technologies })
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="What does AND/OR mean?"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {mounted && showHelp.technologies && tooltipPosition.technologies && createPortal(
                <div
                  data-tooltip
                  className="fixed z-[9999] w-56 p-2.5 bg-gray-900 text-white text-xs rounded shadow-lg"
                  style={{
                    top: `${tooltipPosition.technologies.top}px`,
                    left: `${tooltipPosition.technologies.right + 8}px`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHelp({ ...showHelp, technologies: false })
                    }}
                    className="absolute top-1 right-1 p-0.5 hover:bg-gray-700 rounded"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mb-1.5 pr-5"><strong>AND:</strong> Organization must use ALL selected technologies</p>
                  <p className="pr-5"><strong>OR:</strong> Organization must use ANY selected technology</p>
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
              )}
            </div>
            <div className="flex items-center gap-1 border border-border rounded">
              <button
                onClick={() => toggleLogic('techs')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('techs') === 'AND'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                AND
              </button>
              <button
                onClick={() => toggleLogic('techs')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('techs') === 'OR'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                OR
              </button>
            </div>
          </div>
        </div>
        {expandedSections.technologies && (
          <div className="py-2">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search technologies..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-card text-foreground border border-border rounded-lg outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {visibleTechs.map((tech) => (
                <label key={tech.name} className="flex items-center justify-between py-1.5 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      checked={filters.techs.includes(tech.name)}
                      onChange={() => toggleTech(tech.name)}
                    />
                    <span className="text-[13px] text-foreground/80">{tech.name}</span>
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
      <div className="mb-4 border-t border-border pt-3">
        <div className="flex items-center justify-between w-full py-2">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <span>Categories</span>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                ref={(el) => { helpButtonRefs.current.categories = el }}
                data-help-button
                onClick={(e) => {
                  e.stopPropagation()
                  if (helpButtonRefs.current.categories) {
                    const rect = helpButtonRefs.current.categories.getBoundingClientRect()
                    setTooltipPosition({
                      ...tooltipPosition,
                      categories: { top: rect.top, right: rect.right }
                    })
                  }
                  setShowHelp({ ...showHelp, categories: !showHelp.categories })
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="What does AND/OR mean?"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {mounted && showHelp.categories && tooltipPosition.categories && createPortal(
                <div
                  data-tooltip
                  className="fixed z-[9999] w-56 p-2.5 bg-gray-900 text-white text-xs rounded shadow-lg"
                  style={{
                    top: `${tooltipPosition.categories.top}px`,
                    left: `${tooltipPosition.categories.right + 8}px`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHelp({ ...showHelp, categories: false })
                    }}
                    className="absolute top-1 right-1 p-0.5 hover:bg-gray-700 rounded"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mb-1.5 pr-5"><strong>AND:</strong> Organization must be in ALL selected categories</p>
                  <p className="pr-5"><strong>OR:</strong> Organization must be in ANY selected category</p>
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
              )}
            </div>
            <div className="flex items-center gap-1 border border-border rounded">
              <button
                onClick={() => toggleLogic('categories')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('categories') === 'AND'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                AND
              </button>
              <button
                onClick={() => toggleLogic('categories')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('categories') === 'OR'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                OR
              </button>
            </div>
          </div>
        </div>
        {expandedSections.categories && (
          <div className="py-2">
            <div className="space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {filteredCategories.map((category) => (
                <label key={category} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className="text-[13px] text-foreground/80">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topics Section */}
      <div className="mb-4 border-t border-border pt-3">
        <div className="flex items-center justify-between w-full py-2">
          <button
            onClick={() => toggleSection('topics')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <span>Topics</span>
            {expandedSections.topics ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                ref={(el) => { helpButtonRefs.current.topics = el }}
                data-help-button
                onClick={(e) => {
                  e.stopPropagation()
                  if (helpButtonRefs.current.topics) {
                    const rect = helpButtonRefs.current.topics.getBoundingClientRect()
                    setTooltipPosition({
                      ...tooltipPosition,
                      topics: { top: rect.top, right: rect.right }
                    })
                  }
                  setShowHelp({ ...showHelp, topics: !showHelp.topics })
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="What does AND/OR mean?"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {mounted && showHelp.topics && tooltipPosition.topics && createPortal(
                <div
                  data-tooltip
                  className="fixed z-[9999] w-56 p-2.5 bg-gray-900 text-white text-xs rounded shadow-lg"
                  style={{
                    top: `${tooltipPosition.topics.top}px`,
                    left: `${tooltipPosition.topics.right + 8}px`
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHelp({ ...showHelp, topics: false })
                    }}
                    className="absolute top-1 right-1 p-0.5 hover:bg-gray-700 rounded"
                    aria-label="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mb-1.5 pr-5"><strong>AND:</strong> Organization must have ALL selected topics</p>
                  <p className="pr-5"><strong>OR:</strong> Organization must have ANY selected topic</p>
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
              )}
            </div>
            <div className="flex items-center gap-1 border border-border rounded">
              <button
                onClick={() => toggleLogic('topics')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('topics') === 'AND'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                AND
              </button>
              <button
                onClick={() => toggleLogic('topics')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${getLogicMode('topics') === 'OR'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                OR
              </button>
            </div>
          </div>
        </div>
        {expandedSections.topics && (
          <div className="py-2">
            <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {filteredTopics.map((topic) => (
                <label key={topic} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={filters.topics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                  />
                  <span className="text-[13px] text-foreground/80">{topic}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>


    </div>
  )
}
