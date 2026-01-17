"use client";

import { Code, Eye } from "lucide-react";
import { Badge, Button, CardWrapper, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getTechIcon, isTechnology } from "@/lib/tech-icons";
import { getDifficultyColor } from "@/lib/theme";

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

/**
 * Reusable Project Card Component
 * Used across organization pages, year pages, and project listings
 * 
 * @example
 * <ProjectCard project={project} />
 */
export function ProjectCard({ project, className = "" }: ProjectCardProps) {
  // Extract technologies and topics from tags using shared utility
  const technologies = project.tags?.filter(tag => isTechnology(tag)) || [];
  const topics = project.tags?.filter(tag => !isTechnology(tag)).slice(0, 5) || [];

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
              <Badge key={idx} variant="tech" size="xs">
                {getTechIcon(tech)} {tech}
              </Badge>
            ))}
          </div>
        )}

        {/* Topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Topics:</span>
            {topics.map((topic, idx) => (
              <Badge key={idx} variant="topic" size="xs">
                {topic}
              </Badge>
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

