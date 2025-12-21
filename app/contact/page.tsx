"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import {
  Container,
  SectionHeader,
  Heading,
  Text,
  CardWrapper,
  Input,
  Button,
} from "@/components/ui";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(formData.subject);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      const mailtoLink = `mailto:gsocorganizationsguide@gmail.com?subject=${subject}&body=${body}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Simulate delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-12">
            {/* Header Section */}
            <SectionHeader
              badge="Contact Us"
              title="Get in Touch"
              titleAs="h1"
              description="Have questions, suggestions, or feedback? We'd love to hear from you! Reach out to us and we'll get back to you as soon as possible."
              align="center"
              className="max-w-3xl mx-auto"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <CardWrapper className="p-6">
                  <Heading variant="subsection" className="mb-6">
                    Contact Information
                  </Heading>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Heading variant="small" className="mb-1">
                          Email
                        </Heading>
                        <Text className="text-muted-foreground">
                          <a
                            href="mailto:gsocorganizationsguide@gmail.com"
                            className="hover:text-primary transition-colors"
                          >
                            gsocorganizationsguide@gmail.com
                          </a>
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Heading variant="small" className="mb-1">
                          Response Time
                        </Heading>
                        <Text className="text-muted-foreground">
                          We typically respond within 24-48 hours
                        </Text>
                      </div>
                    </div>
                  </div>
                </CardWrapper>

                <CardWrapper className="p-6">
                  <Heading variant="subsection" className="mb-4">
                    Common Inquiries
                  </Heading>
                  <div className="space-y-3">
                    <div>
                      <Heading variant="small" className="text-sm mb-1">
                        General Questions
                      </Heading>
                      <Text variant="small" className="text-muted-foreground">
                        Questions about GSoC, organizations, or how to use the platform
                      </Text>
                    </div>
                    <div>
                      <Heading variant="small" className="text-sm mb-1">
                        Data Updates
                      </Heading>
                      <Text variant="small" className="text-muted-foreground">
                        Found incorrect information? Let us know and we&apos;ll update it
                      </Text>
                    </div>
                    <div>
                      <Heading variant="small" className="text-sm mb-1">
                        Partnerships
                      </Heading>
                      <Text variant="small" className="text-muted-foreground">
                        Interested in collaborating or featuring your organization?
                      </Text>
                    </div>
                  </div>
                </CardWrapper>
              </div>

              {/* Contact Form */}
              <CardWrapper className="p-6 lg:p-8">
                <Heading variant="subsection" className="mb-6">
                  Send us a Message
                </Heading>
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                    <Heading variant="small">Message Sent!</Heading>
                    <Text className="text-muted-foreground text-center">
                      Thank you for contacting us. We&apos;ll get back to you soon.
                    </Text>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium mb-2 block">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium mb-2 block">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="text-sm font-medium mb-2 block">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What's this about?"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="text-sm font-medium mb-2 block">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more..."
                        rows={6}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardWrapper>
            </div>
          </div>
        </Container>
      </main>
      <FooterSmall />
    </div>
  );
}

