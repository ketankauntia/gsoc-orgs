# Reusable UI Components

This directory contains reusable, generic UI components for consistent styling and behavior across the application.

## Layout Components

### Section
Main container for page sections with consistent padding and max-width.

```tsx
import { Section } from "@/components/ui";

<Section>
  {/* Content */}
</Section>

// Custom padding
<Section noPadding className="py-10">
  {/* Content */}
</Section>

// Full width (no max-width constraint)
<Section fullWidth>
  {/* Content */}
</Section>
```

**Props:**
- `children` - Content to render
- `className` - Additional classes for the section wrapper
- `containerClassName` - Additional classes for the inner container
- `fullWidth` - Remove max-width constraint (default: false)
- `noPadding` - Remove default padding (default: false)

---

### Container
Centered container with consistent max-width and padding.

```tsx
import { Container } from "@/components/ui";

<Container>
  {/* Content */}
</Container>

// Different sizes
<Container size="small">  {/* max-w-4xl */}
<Container size="default"> {/* max-w-6xl */}
<Container size="large">   {/* max-w-7xl */}
<Container size="full">    {/* max-w-full */}
```

**Props:**
- `children` - Content to render
- `className` - Additional classes
- `size` - Container size variant (default: "default")

---

### Grid
Responsive grid layout component.

```tsx
import { Grid } from "@/components/ui";

<Grid cols={{ default: 1, lg: 2 }} gap="md">
  {/* Grid items */}
</Grid>
```

**Props:**
- `children` - Grid items
- `className` - Additional classes
- `cols` - Responsive column configuration
  - `default`, `sm`, `md`, `lg`, `xl` - Number of columns at each breakpoint
- `gap` - Gap size: "none" | "sm" | "md" | "lg" | "xl"

---

## Typography Components

### Heading
Semantic heading component with consistent styling.

```tsx
import { Heading } from "@/components/ui";

<Heading variant="hero" as="h1">
  Page Title
</Heading>

<Heading variant="section" as="h2">
  Section Title
</Heading>
```

**Variants:**
- `hero` - Large hero text (text-5xl md:text-7xl)
- `section` - Section heading (text-3xl md:text-5xl)
- `subsection` - Subsection heading (text-2xl md:text-3xl)
- `small` - Small heading (text-xl md:text-2xl)

**Props:**
- `children` - Text content
- `className` - Additional classes
- `as` - HTML element: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
- `variant` - Style variant (default: "section")

---

### Text
Paragraph and text component with consistent styling.

```tsx
import { Text } from "@/components/ui";

<Text variant="lead">
  Large body text
</Text>

<Text variant="muted">
  Muted description text
</Text>
```

**Variants:**
- `body` - Standard body text
- `lead` - Larger body text (text-lg md:text-xl)
- `muted` - Muted/secondary text
- `small` - Small text

**Props:**
- `children` - Text content
- `className` - Additional classes
- `as` - HTML element: "p" | "span" | "div"
- `variant` - Style variant (default: "body")

---

## Section Components

### SectionHeader
Complete section header with badge, title, and description.

```tsx
import { SectionHeader } from "@/components/ui";

<SectionHeader
  badge="New"
  title="Section Title"
  description="Section description text"
  align="center"
/>
```

**Props:**
- `badge` - Optional badge text
- `title` - Section title (string or ReactNode)
- `description` - Optional description (string or ReactNode)
- `align` - Text alignment: "left" | "center" | "right" (default: "left")
- `className` - Additional classes for wrapper
- `titleClassName` - Additional classes for title
- `descriptionClassName` - Additional classes for description

---

## Card Components

### CardWrapper
Card container with border, shadow, and optional hover effects.

```tsx
import { CardWrapper } from "@/components/ui";

<CardWrapper hover padding="lg">
  {/* Card content */}
</CardWrapper>
```

**Props:**
- `children` - Card content
- `className` - Additional classes
- `hover` - Enable hover effects (default: false)
- `padding` - Padding size: "none" | "sm" | "md" | "lg" (default: "md")

---

## shadcn UI Components

All shadcn components are also exported from the index for convenience:

- `Button`
- `Badge`
- `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger`
- `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`

## Usage Example

```tsx
import {
  Section,
  SectionHeader,
  Grid,
  CardWrapper,
  Button,
} from "@/components/ui";

export const MyComponent = () => (
  <Section>
    <SectionHeader
      badge="Features"
      title="Amazing Features"
      description="Check out what we offer"
      align="center"
    />
    <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
      <CardWrapper hover>
        <h3>Feature 1</h3>
        <p>Description</p>
      </CardWrapper>
      <CardWrapper hover>
        <h3>Feature 2</h3>
        <p>Description</p>
      </CardWrapper>
    </Grid>
    <Button>Get Started</Button>
  </Section>
);
```

## Benefits

✅ **Consistency** - Same styling across the entire app
✅ **DRY** - No repeated className strings
✅ **Type Safety** - Full TypeScript support
✅ **Maintainability** - Update styles in one place
✅ **Flexibility** - Easy to customize with className prop
✅ **Developer Experience** - Clear, intuitive API

