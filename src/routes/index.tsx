import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthGate } from "@/components/AuthGate";
import * as api from "@/game/api";
import { stageHtml } from "@/game/markup";

import "@/game/tnb.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "$TNB Clicker — Trust Nobody Protocol" },
      {
        name: "description",
        content:
          "Tap the eye, farm $TNB, buy degen upgrades and climb the live global leaderboard. Guest mode or Google sign-in, cloud-saved.",
      },
      { property: "og:title", content: "$TNB Clicker — Trust Nobody Protocol" },
      {
        property: "og:description",
        content:
          "Tap the eye, farm $TNB, buy degen upgrades and climb the live global leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <div className="tnb-boot">booting the protocol…</div>;
  }

  if (!session) {
    return <AuthGate />;
  }

  return <GameStage session={session} />;
}

function GameStage({ session }: { session: Session }) {
  const started = useRef(false);
  const isGuest = !session.user.email;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // The signed-in user is the player identity used by the game runtime.
    (window as unknown as { tnbPlayerId?: string }).tnbPlayerId = session.user.id;
    void (async () => {
      // Google players get their account name as the default alias.
      const meta = session.user.user_metadata as Record<string, unknown>;
      const googleName =
        (meta['full_name'] as string) ||
        (meta['name'] as string) ||
        (session.user.email ? session.user.email.split("@")[0] : "");
      if (googleName) {
        try {
          const current = await api.state();
          if (!current?.name || current.name.toLowerCase() === "anonymous") {
            await api.setAlias(googleName.slice(0, 16));
          }
        } catch {
          /* alias seeding is best-effort */
        }
      }
      const [core, layers] = await Promise.all([
        import("@/game/core.js"),
        import("@/game/layers.js"),
      ]);
      core.initGame();
      layers.initLayers();
    })();
  }, [session.user.id, session.user.email, session.user.user_metadata]);


  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function linkGoogle() {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  }

  return (
    <>
      <div className="tnb-account-bar">
        <span className="tnb-account-who">
          {isGuest ? "GUEST SESSION" : (session.user.email ?? "GOOGLE ACCOUNT")}
        </span>
        <span className="tnb-account-actions">
          {isGuest ? (
            <button type="button" onClick={linkGoogle}>
              SAVE WITH GOOGLE
            </button>
          ) : null}
          <button type="button" onClick={signOut}>
            SIGN OUT
          </button>
        </span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: stageHtml }} />
    </>
  );
}
