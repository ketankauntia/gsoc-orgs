"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SubmitState = "idle" | "loading" | "success" | "error";

interface WaitlistCTAProps {
  className?: string;
  embedded?: boolean;
}

export function WaitlistCTA({
  className,
  embedded = false,
}: WaitlistCTAProps) {
  const emailId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!email.trim()) {
        setErrorMessage("Enter an email address to join the roadmap list.");
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
            interests: ["ai-features", "gsoc-tools"],
          }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setErrorMessage(
            result.error ?? "We could not save your email. Try again.",
          );
          setSubmitState("error");
          return;
        }

        setEmail("");
        setSubmitState("success");
      } catch {
        setErrorMessage("Check your connection and try again.");
        setSubmitState("error");
      }
    },
    [email],
  );

  const isLoading = submitState === "loading";
  const content = (
    <div
      className={cn(
        "flex h-full flex-col justify-between p-7 sm:p-10 lg:p-12",
        className,
      )}
    >
      <div>
        <div className="flex size-12 items-center justify-center rounded-xl border border-ink/15 bg-white/24">
          <Mail className="size-5" strokeWidth={1.6} />
        </div>
        <p className="mt-8 font-data text-[10px] uppercase tracking-[0.18em]">
          Early product updates
        </p>
        <h3 className="mt-4 max-w-xl text-3xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-4xl">
          Join the roadmap list.
        </h3>
        <p className="mt-4 max-w-lg text-sm leading-6 text-ink/72">
          Get notified when citation-backed AI briefs, local shortlists, and the
          proposal workspace are ready to test. No promise of selection. No
          weekly marketing sequence.
        </p>
      </div>

      <div className="mt-10">
        {submitState === "success" ? (
          <div
            id={messageId}
            role="status"
            className="flex items-start gap-3 rounded-xl border border-ink/15 bg-white/30 p-4"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-semibold">You are on the roadmap list.</p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                We will only email when there is something real to test.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor={emailId} className="text-sm font-semibold">
              Email address
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                disabled={isLoading}
                aria-describedby={submitState === "error" ? messageId : undefined}
                aria-invalid={submitState === "error"}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (submitState === "error") setSubmitState("idle");
                }}
                className="h-12 flex-1 border-ink/18 bg-white text-ink placeholder:text-ink/45"
              />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={isLoading}
                className="sm:min-w-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Joining
                  </>
                ) : (
                  <>
                    Join the list
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
            <div
              id={messageId}
              aria-live="polite"
              className="mt-3 min-h-5 text-xs font-medium"
            >
              {submitState === "error" ? errorMessage : "Unsubscribe at any time."}
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <section className="bg-primary px-3 py-3 text-primary-foreground sm:px-5 sm:py-5">
      <div className="mx-auto max-w-shell overflow-hidden rounded-[1.5rem] border border-ink/15">
        {content}
      </div>
    </section>
  );
}

