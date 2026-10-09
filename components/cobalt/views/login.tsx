import Link from "next/link";
import { IconPlugConnectedX } from "@tabler/icons-react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Eyebrow } from "../ui";
import "../community.css";

// Kept apart from the other community views: the sign-in controls carry the auth client,
// which would otherwise load on every page built from those views.

export function LoginView({ configured, next, error }: { configured: boolean; next: string; error: "oauth" | "suspended" | null }) {
  return (
    <main className="cb-cm-center">
      <div className="cb-hero-grid" aria-hidden="true" />
      <div className="cb-card cb-cm-login">
        <Eyebrow>CONTRIBUTORS AND MENTORS</Eyebrow>
        <h1>Claim your GSoC project</h1>
        <p className="cb-cm-login-lede">Sign in with Google to claim the project you contributed to or mentored, publish your accepted proposal and link your progress posts. Your email stays private.</p>
        <div className="cb-cm-login-action">
          {error === "suspended" ? <SignOutButton /> : configured ? <GoogleSignIn next={next} /> : <p className="cb-cm-notice"><IconPlugConnectedX size={18} stroke={1.75} aria-hidden /><span>Sign-in is not available right now.</span></p>}
        </div>
        {error === "oauth" ? <p role="alert" className="cb-cm-alert">Google sign-in could not be completed. Please try again.</p> : null}
        {error === "suspended" ? <p role="alert" className="cb-cm-alert">This account is suspended. <Link className="cb-inline-link" href="/contact">Contact us</Link> if you think this is a mistake.</p> : null}
        <p className="cb-cm-login-fine">By continuing, you agree to the <Link className="cb-inline-link" href="/terms-and-conditions">terms</Link> and acknowledge the <Link className="cb-inline-link" href="/privacy-policy">privacy policy</Link>.</p>
      </div>
    </main>
  );
}
