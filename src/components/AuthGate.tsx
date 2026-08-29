import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/**
 * Sign-in screen shown before the game boots.
 * Two ways in: an instant guest session, or a Google account that keeps
 * the run attached to a real identity across devices.
 */
export function AuthGate() {
  const [busy, setBusy] = useState<"guest" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function playAsGuest() {
    setBusy("guest");
    setError(null);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
      setBusy(null);
      return;
    }
    await supabase
      .from("profiles")
      .upsert({ id: (await supabase.auth.getUser()).data.user!.id, is_guest: true });
  }

  async function continueWithGoogle() {
    setBusy("google");
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Try again.");
      setBusy(null);
      return;
    }
  }

  return (
    <div className="tnb-gate">
      <section className="tnb-auth-card tnb-gate-card">
        <div className="tnb-auth-kicker">IDENTITY MODE</div>
        <div className="tnb-auth-title">SAVE YOUR DEGEN RUN</div>
        <div className="tnb-auth-copy">
          Play instantly as a guest, or keep your bag forever with Google. Your degen alias stays
          separate from your Google profile.
        </div>
        <div className="tnb-auth-actions">
          <button
            className="tnb-auth-btn tnb-auth-guest"
            type="button"
            disabled={busy !== null}
            onClick={playAsGuest}
          >
            {busy === "guest" ? "STARTING…" : "PLAY AS GUEST"}
          </button>
          <button
            className="tnb-auth-btn tnb-auth-google"
            type="button"
            disabled={busy !== null}
            onClick={continueWithGoogle}
          >
            {busy === "google" ? "REDIRECTING…" : "🔵 CONTINUE WITH GOOGLE"}
          </button>
        </div>
        {error ? <div className="tnb-auth-error">{error}</div> : null}
      </section>
    </div>
  );
}
