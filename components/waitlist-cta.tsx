"use client";

import { useState, useCallback, FormEvent } from "react";
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
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
    <section className={cn("w-full py-16 lg:py-24 bg-white dark:bg-zinc-950", className)}>
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="relative rounded-3xl overflow-hidden bg-blue-600 dark:bg-blue-700 w-full px-6 py-16 md:py-24 md:px-12 lg:px-20 text-center flex flex-col items-center justify-center min-h-[500px] shadow-2xl shadow-blue-900/20">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/50 blur-[100px]" />
            <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-400/30 blur-[120px]" />
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/40 blur-[80px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-100" />
              <span>Coming Soon</span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-6">
              <h2 className="text-4xl md:text-5xl lg:text-7xl tracking-[-0.02em] font-bold text-white leading-tight">
                Unlock AI Insights for GSoC
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-blue-100/90 max-w-2xl mx-auto font-medium">
                Join the waitlist to get early access to AI-powered GSoC indepth insights on seleting organizations, choosing a tech-stack, writing & evaluating proposals and smart analytics to maximize your selection chances for GSoC 2026.
              </p>
            </div>

            {/* Form */}
            <div className="w-full max-w-md mt-4">
              {isSuccess ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-5 shadow-inner">
                  <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                  <p className="text-white font-medium text-lg">
                    You&apos;re on the list! We&apos;ll notify you when we launch.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20 focus-within:ring-2 focus-within:ring-white/50 focus-within:border-white/50 transition-all shadow-xl">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (submitState === "error") setSubmitState("idle");
                      }}
                      disabled={isLoading}
                      aria-label="Email address"
                      autoComplete="email"
                      className="flex-1 h-14 bg-transparent border-none text-white placeholder:text-blue-100/60 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-lg"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="h-14 px-8 rounded-xl bg-white hover:bg-zinc-100 text-blue-700 font-bold gap-2 text-base transition-colors shrink-0 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  {submitState === "error" && errorMessage && (
                    <p className="text-red-300 font-medium text-sm text-center bg-red-900/40 py-2 px-4 rounded-lg inline-block w-fit mx-auto border border-red-500/20 backdrop-blur-sm">
                      {errorMessage}
                    </p>
                  )}

                  <p className="text-sm text-blue-200/80 font-medium">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
