"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button, Input } from "@/components/ui";
import { X, Search } from "lucide-react";

interface StackPopularityChartProps {
  data: Record<string, Array<{ year: number; count: number }>>;
  availableTechs?: Array<{ name: string; slug: string }>;
}

// Teal-based color palette for lines
const LINE_COLORS = [
  "#0d9488", // teal-600
  "#14b8a6", // teal-500
  "#2dd4bf", // teal-400
  "#5eead4", // teal-300
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#f59e0b", // amber-500
  "#f97316", // orange-500
];

export function StackPopularityChart({ data, availableTechs = [] }: StackPopularityChartProps) {
  const [selectedTechs, setSelectedTechs] = useState<string[]>(() => {
    // Default to top 3 techs
    const top3 = Object.keys(data || {}).slice(0, 3)
    return top3.length > 0 ? top3 : []
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  // Get all available techs from data if not provided
  const allTechs = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return []
    if (availableTechs.length > 0) {
      return availableTechs.map(t => ({ name: t.name.toLowerCase(), displayName: t.name }))
    }
    return Object.keys(data).map(tech => ({ 
      name: tech, 
      displayName: tech.charAt(0).toUpperCase() + tech.slice(1) 
    }))
  }, [data, availableTechs])

  // Filter techs based on search query
  const filteredTechs = useMemo(() => {
    if (!searchQuery.trim()) return allTechs
    const query = searchQuery.toLowerCase()
    return allTechs.filter(tech => 
      tech.name.toLowerCase().includes(query) || 
      tech.displayName.toLowerCase().includes(query)
    )
  }, [allTechs, searchQuery])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
        No popularity data available
      </div>
    );
  }

  // Filter data to only selected techs
  const filteredData: Record<string, Array<{ year: number; count: number }>> = {}
  selectedTechs.forEach(tech => {
    if (data[tech]) {
      filteredData[tech] = data[tech]
    }
  })

  const stacks = Object.keys(filteredData)
  const years = stacks.length > 0 && filteredData[stacks[0]] 
    ? filteredData[stacks[0]].map(d => d.year) 
    : []
  
  const chartData = years.map(year => {
    const point: Record<string, number> = { year }
    stacks.forEach(stack => {
      const stackData = filteredData[stack]
      const yearData = stackData?.find(d => d.year === year)
      point[stack] = yearData?.count || 0
    })
    return point
  })

  const maxCount = Math.max(
    ...Object.values(filteredData).flatMap(arr => arr.map(d => d.count)),
    1
  )

  const handleAddTech = (tech: string) => {
    if (!selectedTechs.includes(tech) && selectedTechs.length < 8) {
      setSelectedTechs([...selectedTechs, tech])
      setSearchQuery("")
      setShowDropdown(false)
    }
  }

  const handleRemoveTech = (tech: string) => {
    setSelectedTechs(selectedTechs.filter(t => t !== tech))
  }

  const handleReset = () => {
    const top3 = Object.keys(data).slice(0, 3)
    setSelectedTechs(top3.length > 0 ? top3 : [])
    setSearchQuery("")
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      {/* Tech Selection Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Compare Technologies:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
          >
            Reset
          </Button>
        </div>
        
        {/* Selected Techs */}
        {selectedTechs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTechs.map(tech => {
              const displayName = allTechs.find(t => t.name === tech)?.displayName || tech
              return (
                <div
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 text-teal-800 rounded-md text-xs font-medium"
                >
                  <span>{displayName}</span>
                  <button
                    onClick={() => handleRemoveTech(tech)}
                    className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${displayName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Searchable Dropdown */}
        {selectedTechs.length < 8 && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search and add technology to compare..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9 pr-3 h-9 text-sm"
              />
            </div>
            
            {/* Dropdown List */}
            {showDropdown && filteredTechs.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                  aria-hidden="true"
                  style={{ pointerEvents: 'auto' }}
                />
                <div className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredTechs
                    .filter(tech => !selectedTechs.includes(tech.name))
                    .slice(0, 50) // Limit to 50 for performance
                    .map(tech => (
                      <button
                        key={tech.name}
                        onClick={() => handleAddTech(tech.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {tech.displayName}
                      </button>
                    ))}
                  {filteredTechs.filter(tech => !selectedTechs.includes(tech.name)).length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                          No technologies found
                        </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {stacks.length > 0 ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                domain={[0, Math.ceil(maxCount * 1.2)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  const displayName = allTechs.find(t => t.name === name)?.displayName || name
                  return [value, displayName]
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "11px" }}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => {
                  const displayName = allTechs.find(t => t.name === value)?.displayName || value
                  return displayName
                }}
              />
              {stacks.map((stack, index) => (
                <Line
                  key={stack}
                  type="monotone"
                  dataKey={stack}
                  name={stack}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS[index % LINE_COLORS.length], strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
          Select technologies to compare
        </div>
      )}
    </div>
  );
}
