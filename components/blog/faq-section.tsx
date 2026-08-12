import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/blog-ui/accordion";
import type { Faq } from "@/lib/blog/types";

/** Reader-facing FAQ accordion. FAQs are not emitted as obsolete Google FAQ rich-result markup. */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section id="faqs" aria-label="Frequently asked questions" className="scroll-mt-24">
      <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={faq.question} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
