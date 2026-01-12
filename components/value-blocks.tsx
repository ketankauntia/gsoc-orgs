import { Badge } from "@/components/ui/badge";
import { Building2, History, Code2, BarChart3 } from "lucide-react";

// Right-image block: Text flows right-to-left (right-aligned, towards the image)
export function OrganizationsBlock() {
  return (
    <section className="w-full py-12 lg:py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:items-center lg:justify-center">
          <div className="flex gap-4 flex-col flex-1 lg:items-end lg:text-right">
            <div>
              <Badge variant="outline" className="gap-2">
                <Building2 className="size-3" />
                Organizations
              </Badge>
            </div>
            <div className="flex gap-2 flex-col lg:items-end">
              <h2 className="text-xl md:text-3xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular">
                Explore 200+ GSoC Organizations
              </h2>
              <p className="text-lg max-w-xl lg:max-w-sm leading-relaxed tracking-tight text-muted-foreground">
                Browse through all participating GSoC organizations with detailed 
                profiles, tech stacks, project ideas, and historical performance data. 
                Filter by language, category, or beginner-friendliness to find your perfect match.
              </p>
            </div>
          </div>
          <div className="bg-muted rounded-md w-full aspect-video flex items-center justify-center max-w-sm lg:max-w-md shrink-0">
            <Building2 className="size-16 text-muted-foreground/50" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Left-image block: Text flows left-to-right (left-aligned, away from the image)
export function PreviousEditionsBlock() {
  return (
    <section className="w-full py-12 lg:py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:items-center lg:justify-center">
          <div className="bg-muted rounded-md w-full aspect-video flex items-center justify-center max-w-sm lg:max-w-md shrink-0">
            <History className="size-16 text-muted-foreground/50" />
          </div>
          <div className="flex gap-4 flex-col flex-1">
            <div>
              <Badge variant="outline" className="gap-2">
                <History className="size-3" />
                Previous Editions
              </Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-xl md:text-3xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular">
                Learn from Past GSoC Years
              </h2>
              <p className="text-lg max-w-xl lg:max-w-sm leading-relaxed tracking-tight text-muted-foreground">
                Access comprehensive data from GSoC 2016 to 2025. Study past projects, 
                understand what worked, see mentor patterns, and identify organizations 
                with consistent participation and high success rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Right-image block: Text flows right-to-left (right-aligned, towards the image)
export function TechStackBlock() {
  return (
    <section className="w-full py-12 lg:py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:items-center lg:justify-center">
          <div className="flex gap-4 flex-col flex-1 lg:items-end lg:text-right">
            <div>
              <Badge variant="outline" className="gap-2">
                <Code2 className="size-3" />
                Tech Stack
              </Badge>
            </div>
            <div className="flex gap-2 flex-col lg:items-end">
              <h2 className="text-xl md:text-3xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular">
                Find Orgs by Technology
              </h2>
              <p className="text-lg max-w-xl lg:max-w-sm leading-relaxed tracking-tight text-muted-foreground">
                Python, JavaScript, Rust, Go, or any other language — filter organizations 
                by your preferred tech stack. See which technologies are trending in GSoC 
                and match your skills with the right opportunities.
              </p>
            </div>
          </div>
          <div className="bg-muted rounded-md w-full aspect-video flex items-center justify-center max-w-sm lg:max-w-md shrink-0">
            <Code2 className="size-16 text-muted-foreground/50" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Left-image block: Text flows left-to-right (left-aligned, away from the image)
export function AnalyticsBlock() {
  return (
    <section className="w-full py-12 lg:py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:items-center lg:justify-center">
          <div className="bg-muted rounded-md w-full aspect-video flex items-center justify-center max-w-sm lg:max-w-md shrink-0">
            <BarChart3 className="size-16 text-muted-foreground/50" />
          </div>
          <div className="flex gap-4 flex-col flex-1">
            <div>
              <Badge variant="outline" className="gap-2">
                <BarChart3 className="size-3" />
                Analytics
              </Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-xl md:text-3xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular">
                Data-Driven Insights
              </h2>
              <p className="text-lg max-w-xl lg:max-w-sm leading-relaxed tracking-tight text-muted-foreground">
                Make informed decisions with visual analytics. Track organization trends, 
                compare acceptance rates, analyze project difficulty distributions, and 
                discover patterns that increase your selection chances.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
