import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/tech-stack/analytics
 * 
 * Returns analytics data for the tech stack index page:
 * - Top tech stacks by organization count
 * - Stack popularity over years
 * - Beginner-friendly orgs by technology
 */
export async function GET() {
  try {
    // Get all organizations with their data
    const organizations = await prisma.organizations.findMany({
      select: {
        id_: true,
        name: true,
        slug: true,
        technologies: true,
        active_years: true,
        years: true,
        total_projects: true,
        is_currently_active: true,
      },
    })

    // 1. Calculate tech stack usage counts
    const techMap = new Map<string, { name: string; count: number }>()
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        const techLower = tech.toLowerCase()
        const existing = techMap.get(techLower)
        if (existing) {
          existing.count++
        } else {
          techMap.set(techLower, { name: tech, count: 1 })
        }
      })
    })

    const topTechStacks = Array.from(techMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((tech) => ({
        name: tech.name,
        slug: tech.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        count: tech.count,
      }))

    // 2. Calculate stack popularity over years (for ALL techs - user can select any)
    const years = [2020, 2021, 2022, 2023, 2024]
    
    const stackPopularityByYear: Record<string, Array<{ year: number; count: number }>> = {}
    
    // Calculate for ALL unique techs (not just top 20)
    const allUniqueTechs = Array.from(new Set(
      organizations.flatMap(org => org.technologies.map(t => t.toLowerCase()))
    ))
    
    allUniqueTechs.forEach(stackName => {
      stackPopularityByYear[stackName] = years.map(year => {
        const count = organizations.filter(org => {
          const hasTech = org.technologies.some(t => t.toLowerCase() === stackName)
          const wasActiveInYear = org.active_years.includes(year)
          return hasTech && wasActiveInYear
        }).length
        return { year, count }
      })
    })

    // 3. Calculate difficulty distribution for Python (as example)
    // Get orgs that use Python and count their project difficulties
    const pythonOrgs = organizations.filter(org => 
      org.technologies.some(t => t.toLowerCase() === 'python')
    )

    const difficultyCount: Record<string, number> = {
      'Beginner': 0,
      'Intermediate': 0,
      'Advanced': 0,
    }

    pythonOrgs.forEach(org => {
      if (org.years) {
        const yearsData = org.years as Record<string, { projects?: Array<{ difficulty?: string }> }>
        Object.values(yearsData).forEach(yearData => {
          if (yearData && yearData.projects) {
            yearData.projects.forEach(project => {
              const diff = project.difficulty
              if (diff && diff in difficultyCount) {
                difficultyCount[diff]++
              }
            })
          }
        })
      }
    })

    // Calculate beginner-friendly orgs for top tech stacks
    const beginnerFriendlyByTech: Record<string, {
      beginner: number;
      intermediate: number;
      advanced: number;
    }> = {}

    topTechStacks.slice(0, 6).forEach(tech => {
      const techOrgs = organizations.filter(org => 
        org.technologies.some(t => t.toLowerCase() === tech.name.toLowerCase())
      )
      
      const counts = { beginner: 0, intermediate: 0, advanced: 0 }
      
      techOrgs.forEach(org => {
        if (org.years) {
          const yearsData = org.years as Record<string, { projects?: Array<{ difficulty?: string }> }>
          const orgCounts = { beginner: 0, intermediate: 0, advanced: 0 }
          
          Object.values(yearsData).forEach(yearData => {
            if (yearData && yearData.projects) {
              yearData.projects.forEach(project => {
                const diff = project.difficulty?.toLowerCase()
                if (diff === 'beginner' || diff === 'easy') {
                  orgCounts.beginner++
                } else if (diff === 'intermediate' || diff === 'medium') {
                  orgCounts.intermediate++
                } else if (diff === 'advanced' || diff === 'hard') {
                  orgCounts.advanced++
                }
              })
            }
          })
          
          // Add to total counts
          counts.beginner += orgCounts.beginner
          counts.intermediate += orgCounts.intermediate
          counts.advanced += orgCounts.advanced
        }
      })
      
      beginnerFriendlyByTech[tech.name.toLowerCase()] = counts
    })

    // 4. Calculate tech stacks with most selections (2025-2020, reverse order)
    const past6Years = [2025, 2024, 2023, 2022, 2021, 2020]
    const techSelectionsByYear: Record<string, Record<number, number>> = {}
    
    organizations.forEach(org => {
      org.technologies.forEach(tech => {
        const techLower = tech.toLowerCase()
        if (!techSelectionsByYear[techLower]) {
          techSelectionsByYear[techLower] = {}
        }
        past6Years.forEach(year => {
          if (org.active_years.includes(year)) {
            techSelectionsByYear[techLower][year] = (techSelectionsByYear[techLower][year] || 0) + 1
          }
        })
      })
    })
    
    const mostSelections = Object.entries(techSelectionsByYear)
      .map(([tech, yearCounts]) => {
        const total = past6Years.reduce((sum, year) => sum + (yearCounts[year] || 0), 0)
        return {
          name: tech,
          total,
          byYear: past6Years.map(year => ({ year, count: yearCounts[year] || 0 }))
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 5. Calculate tech stacks with most projects (2025-2020)
    const techProjectsByYear: Record<string, Record<number, number>> = {}
    
    organizations.forEach(org => {
      org.technologies.forEach(tech => {
        const techLower = tech.toLowerCase()
        if (!techProjectsByYear[techLower]) {
          techProjectsByYear[techLower] = {}
        }
        past6Years.forEach(year => {
          if (org.years) {
            const yearKey = `year_${year}`
            const yearData = (org.years as Record<string, { num_projects?: number }>)[yearKey]
            if (yearData && org.active_years.includes(year)) {
              const projectCount = yearData.num_projects || 0
              techProjectsByYear[techLower][year] = (techProjectsByYear[techLower][year] || 0) + projectCount
            }
          }
        })
      })
    })
    
    const mostProjects = Object.entries(techProjectsByYear)
      .map(([tech, yearCounts]) => {
        const total = past6Years.reduce((sum, year) => sum + (yearCounts[year] || 0), 0)
        return {
          name: tech,
          total,
          byYear: past6Years.map(year => ({ year, count: yearCounts[year] || 0 }))
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 6. Calculate tech stacks with highest % increase in projects (2025-2020)
    const popularityGrowth = Object.entries(techProjectsByYear)
      .map(([tech, yearCounts]) => {
        const firstYear = yearCounts[2020] || 0
        const lastYear = yearCounts[2025] || 0
        const percentIncrease = firstYear > 0 
          ? ((lastYear - firstYear) / firstYear) * 100 
          : lastYear > 0 ? 1000 : 0 // If started from 0, show high growth
        const total = past6Years.reduce((sum, year) => sum + (yearCounts[year] || 0), 0)
        return {
          name: tech,
          percentIncrease,
          total,
          firstYear,
          lastYear,
          byYear: past6Years.map(year => ({ year, count: yearCounts[year] || 0 }))
        }
      })
      .filter(item => item.total > 0) // Only include techs with projects
      .sort((a, b) => b.percentIncrease - a.percentIncrease)
      .slice(0, 10)

    return NextResponse.json({
      topTechStacks,
      stackPopularityByYear,
      beginnerFriendlyByTech,
      pythonDifficultyDistribution: [
        { level: 'Beginner Friendly', count: difficultyCount['Beginner'] },
        { level: 'Intermediate Friendly', count: difficultyCount['Intermediate'] },
        { level: 'Advanced Friendly', count: difficultyCount['Advanced'] },
      ],
      mostSelections,
      mostProjects,
      popularityGrowth,
      totalOrganizations: organizations.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tech stack analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tech stack analytics' },
      { status: 500 }
    )
  }
}

