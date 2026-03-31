import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Heading, Text } from "@/components/ui/typography";

export const gsocFaq = [
  {
    question: "What is Google Summer of Code (GSoC)?",
    answer: "Google Summer of Code is an open-source program where contributors work with mentor organizations on real-world software projects and receive a stipend from Google."
  },
  {
    question: "Who is eligible for GSoC?",
    answer: "Anyone who meets Google’s eligibility requirements can participate—students and non-students. Organizations typically look for consistent interest, communication skills, and basic familiarity with their tech stack."
  },
  {
    question: "How do I find the right GSoC organization?",
    answer: "Choose an organization based on your tech stack, project ideas, beginner-friendliness, and past GSoC performance. Reviewing previous projects helps you understand what each organization expects."
  },
  {
    question: "What is the GSoC timeline for 2026?",
    answer: "The GSoC timeline includes phases like org announcements, contributor applications, coding period, and evaluations. Dates change yearly, but you can track every update using our timeline tools."
  },
  {
    question: "How do I choose a GSoC project idea?",
    answer: "Explore official org ideas pages and analyze previous GSoC projects to understand feasibility, required skills, and mentor expectations. Pick an idea that matches your interests and experience."
  },
  {
    question: "Do I need to contribute before submitting my GSoC proposal?",
    answer: "Most organizations recommend making small contributions, exploring the codebase, or asking relevant questions before applying. It shows commitment and improves your chances of selection."
  },
  {
    question: "How do I write a strong GSoC proposal?",
    answer: "A strong proposal includes clear goals, achievable milestones, a realistic timeline, understanding of the project, and evidence of communication with mentors. Reviewing previous accepted proposals helps a lot."
  },
  {
    question: "Where can I find previous GSoC projects?",
    answer: "You can browse previous GSoC projects from past years on our website. They include mentors, difficulty levels, technologies used, and project outcomes to help you prepare better."
  },
  {
    question: "Which programming languages are used in GSoC?",
    answer: "GSoC organizations use many languages including Python, JavaScript, C++, Java, Rust, Go, Kotlin, and more. Each org lists the technologies required for their project ideas."
  },
  {
    question: "Is GSoC difficult for beginners?",
    answer: "No—many GSoC organizations offer beginner-friendly project ideas. With early preparation, consistent communication, and a solid proposal, beginners have a strong chance of getting selected."
  }
];

export const FaqComponent = () => (
  <section className="w-full py-24 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
    <div className="container mx-auto px-4 md:px-6 max-w-7xl">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Side: Title & Description */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-32">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400 mb-2">
            FAQ
          </div>
          <Heading as="h2" className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Google Summer of Code Queries
          </Heading>
          <Text className="text-lg text-zinc-600 dark:text-zinc-400">
            Understanding GSoC organizations, project ideas, timelines, and proposal requirements can be challenging. This FAQ gives you clear, concise answers to the most common GSoC queries helping you prepare smarter.
          </Text>
        </div>
        
        {/* Right Side: Accordion */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <Accordion type="single" collapsible className="w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            {gsocFaq.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={"item-" + index}
                className="border-none px-6 sm:px-8 py-2 data-[state=open]:bg-zinc-50 dark:data-[state=open]:bg-zinc-900/50 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-zinc-900 dark:text-zinc-100 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-600 dark:text-zinc-400 leading-relaxed pb-6 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
      </div>
    </div>
  </section>
);