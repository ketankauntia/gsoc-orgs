"use client";

import { useState, useCallback, FormEvent } from "react";
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button, Input, Section } from "@/components/ui";
import { cn } from "@/lib/utils";

type SubmitState = "idle" | "loading" | "success" | "error";

interface WaitlistCTAProps {
  className?: string;
}

export function WaitlistCTA({ className }: WaitlistCTAProps) {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!email.trim()) {
        setErrorMessage("Please enter your email address.");
        setSubmitState("error");
        return;
      }

      setSubmitState("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            interests: ["ai-features"],
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || "Something went wrong. Please try again.");
          setSubmitState("error");
          return;
        }

        setSubmitState("success");
        setEmail("");
      } catch {
        setErrorMessage("Network error. Please check your connection and try again.");
        setSubmitState("error");
      }
    },
    [email]
  );

  const isSuccess = submitState === "success";
  const isLoading = submitState === "loading";

  return (
    <Section className={cn("py-12 lg:py-20", className)} noPadding>
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="rounded-2xl bg-muted/50 border border-border p-8 sm:p-10 lg:p-12">
          <div className="flex flex-col items-center text-center gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-grey px-4 py-2 text-xs font-semibold text-black">
              <Sparkles className="size-4" />
              <span>Coming Soon</span>
            </div>

            {/* Heading with highlighted text */}
            <div className="flex flex-col gap-4 max-w-2xl">
              <h2 className="text-3xl md:text-5xl tracking-tighter font-regular text-foreground">
                Unlock AI Insights for GSoC 
              </h2>
              <p className="text-md md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-xxl mx-auto">
                Join the waitlist to get early access to AI-powered GSoC indepth insights on seleting organizations, choosing a tech-stack, writing & evaluating proposals and smart analytics to maximize your selection chances for GSoC 2026.
              </p>
            </div>

            {/* Form or Success Message */}
            {isSuccess ? (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-6 py-4">
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                <p className="text-green-700 font-medium">
                  You&apos;re on the list! We&apos;ll notify you when we launch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (submitState === "error") setSubmitState("idle");
                    }}
                    disabled={isLoading}
                    aria-label="Email address"
                    autoComplete="email"
                    className="flex-1 h-12"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 text-white gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>

                {submitState === "error" && errorMessage && (
                  <p className="text-destructive text-sm text-center">
                    {errorMessage}
                  </p>
                )}

                <p className="text-sm text-muted-foreground">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
