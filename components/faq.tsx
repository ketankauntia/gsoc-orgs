import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Section,
  SectionHeader,
} from "@/components/ui";

export const gsocFaq = [
  {
    question: "What is Google Summer of Code (GSoC)?",
    answer:
      "Google Summer of Code is an open-source program where contributors work with mentor organizations on real-world software projects and receive a stipend from Google."
  },
  {
    question: "Who is eligible for GSoC?",
    answer:
      "Anyone who meets Google’s eligibility requirements can participate—students and non-students. Organizations typically look for consistent interest, communication skills, and basic familiarity with their tech stack."
  },
  {
    question: "How do I find the right GSoC organization?",
    answer:
      "Choose an organization based on your tech stack, project ideas, beginner-friendliness, and past GSoC performance. Reviewing previous projects helps you understand what each organization expects."
  },
  {
    question: "What is the GSoC timeline for 2026?",
    answer:
      "The GSoC timeline includes phases like org announcements, contributor applications, coding period, and evaluations. Dates change yearly, but you can track every update using our timeline tools."
  },
  {
    question: "How do I choose a GSoC project idea?",
    answer:
      "Explore official org ideas pages and analyze previous GSoC projects to understand feasibility, required skills, and mentor expectations. Pick an idea that matches your interests and experience."
  },
  {
    question: "Do I need to contribute before submitting my GSoC proposal?",
    answer:
      "Most organizations recommend making small contributions, exploring the codebase, or asking relevant questions before applying. It shows commitment and improves your chances of selection."
  },
  {
    question: "How do I write a strong GSoC proposal?",
    answer:
      "A strong proposal includes clear goals, achievable milestones, a realistic timeline, understanding of the project, and evidence of communication with mentors. Reviewing previous accepted proposals helps a lot."
  },
  {
    question: "Where can I find previous GSoC projects?",
    answer:
      "You can browse previous GSoC projects from past years on our website. They include mentors, difficulty levels, technologies used, and project outcomes to help you prepare better."
  },
  {
    question: "Which programming languages are used in GSoC?",
    answer:
      "GSoC organizations use many languages including Python, JavaScript, C++, Java, Rust, Go, Kotlin, and more. Each org lists the technologies required for their project ideas."
  },
  {
    question: "Is GSoC difficult for beginners?",
    answer:
      "No—many GSoC organizations offer beginner-friendly project ideas. With early preparation, consistent communication, and a solid proposal, beginners have a strong chance of getting selected."
  }
];


export const FaqComponent = () => (
  <Section>
    <div className="grid lg:grid-cols-2 gap-10">
      <div className="flex gap-10 flex-col">
        <SectionHeader
          badge="FAQ"
          title="Google Summer of Code Related Queries"
          description="Understanding GSoC organizations, project ideas, timelines, and proposal requirements can be challenging. This FAQ gives you clear, concise answers to the most common GSoC queries helping you prepare smarter and avoid confusion."
        />
      </div>
      <Accordion type="single" collapsible className="w-full">
        {gsocFaq.map((faq, index) => (
          <AccordionItem key={index} value={"index-" + index}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </Section>
);