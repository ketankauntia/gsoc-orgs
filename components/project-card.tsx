"use client";

import { Code, Eye } from "lucide-react";
import { Button, CardWrapper, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    short_description?: string;
    description?: string;
    student_name?: string;
    contributor?: string;
    difficulty?: string;
    tags?: string[];
    slug?: string;
    code_url?: string;
    project_url?: string;
    project_code_url?: string;
    mentors?: string;
  };
  className?: string;
}

// Technology icons mapping
const getTechIcon = (tech: string) => {
  const techLower = tech.toLowerCase();
  if (techLower.includes('python')) return '🐍';
  if (techLower.includes('javascript') || techLower.includes('js')) return '🟨';
  if (techLower.includes('typescript') || techLower.includes('ts')) return '🔷';
  if (techLower.includes('java') && !techLower.includes('script')) return '☕';
  if (techLower.includes('c++') || techLower.includes('cpp')) return '⚙️';
  if (techLower.includes('rust')) return '🦀';
  if (techLower.includes('go') || techLower === 'golang') return '🐹';
  if (techLower.includes('ruby')) return '💎';
  if (techLower.includes('php')) return '🐘';
  if (techLower.includes('swift')) return '🍎';
  if (techLower.includes('kotlin')) return '🟣';
  if (techLower.includes('react')) return '⚛️';
  if (techLower.includes('node')) return '🟢';
  if (techLower.includes('docker')) return '🐳';
  if (techLower.includes('kubernetes') || techLower.includes('k8s')) return '☸️';
  return '📦';
};

/**
 * Reusable Project Card Component
 * Used across organization pages, year pages, and project listings
 */
export function ProjectCard({ project, className = "" }: ProjectCardProps) {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-emerald-500';
      case 'intermediate':
      case 'medium':
        return 'bg-amber-500';
      case 'advanced':
      case 'hard':
        return 'bg-orange-600';
      default:
        return 'bg-gray-400';
    }
  };

  // Extract technologies and topics from tags
  const technologies = project.tags?.filter(tag => 
    ['python', 'javascript', 'java', 'c++', 'typescript', 'rust', 'go', 'ruby', 'php', 'swift', 'kotlin', 'react', 'node', 'docker', 'loki'].some(t => tag.toLowerCase().includes(t))
  ) || [];
  
  const topics = project.tags?.filter(tag => 
    !technologies.includes(tag)
  ).slice(0, 5) || [];

  const projectUrl = project.project_url || project.project_code_url || '#';
  const codeUrl = project.code_url || project.project_code_url;

  return (
    <CardWrapper padding="md" hover className={cn("flex flex-col relative", className)}>
      {/* Difficulty Badge */}
      {project.difficulty && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", getDifficultyColor(project.difficulty))} />
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {project.difficulty}
          </span>
        </div>
      )}

      <div className="flex-1 space-y-3 pt-6">
        {/* Title */}
        <Heading variant="small" className="text-base line-clamp-2 font-semibold">
          {project.title}
        </Heading>

        {/* Contributor */}
        {project.contributor && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Contributor:</span> {project.contributor}
          </div>
        )}
        
        {/* Mentor */}
        {project.mentors && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Mentor:</span> {project.mentors}
          </div>
        )}

        {/* Description */}
        <Text variant="small" className="line-clamp-3 text-foreground/70">
          {project.short_description || project.description}
        </Text>

        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {technologies.slice(0, 3).map((tech, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md">
                {getTechIcon(tech)} {tech}
              </span>
            ))}
          </div>
        )}

        {/* Topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Topics:</span>
            {topics.map((topic, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 border rounded-md">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-auto flex gap-2">
        <Button variant="default" size="sm" asChild className="flex-1 bg-teal-600 hover:bg-teal-700">
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Project
          </a>
        </Button>
        {codeUrl && (
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a
              href={codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4" />
              View Code
            </a>
          </Button>
        )}
      </div>
    </CardWrapper>
  );
}

