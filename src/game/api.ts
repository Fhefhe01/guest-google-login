import { supabase } from "@/integrations/supabase/client";

/**
 * Single place where the game talks to the cloud database.
 * Every score-changing call is a database function that recomputes the
 * authoritative state, so the browser can never write a score directly.
 */

export type UpgradeDef = {
  name: string;
  perClick: number;
  perSec: number;
  nextCost: number;
};

export type GameState = {
  score: number;
  perClick: number;
  perSec: number;
  upgrades: Record<string, UpgradeDef>;
  owned: Record<string, number>;
  name: string;
  bestCombo: number;
  perfectTaps: number;
  criticalTaps: number;
};

export type LeaderboardRow = { id: string; name: string; score: number };

async function call(fn: "tnb_state"): Promise<GameState>;
async function call(fn: "tnb_click", args: { _taps: number }): Promise<GameState>;
async function call(fn: "tnb_buy", args: { _upgrade_id: string }): Promise<GameState>;
async function call(fn: "tnb_reset"): Promise<GameState>;
async function call(fn: "tnb_set_alias", args: { _alias: string }): Promise<GameState>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(fn: any, args?: any): Promise<GameState> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as unknown as GameState;
}

export const state = () => call("tnb_state");
export const click = (taps = 1) => call("tnb_click", { _taps: taps });
export const buy = (upgradeId: string) => call("tnb_buy", { _upgrade_id: upgradeId });
export const reset = () => call("tnb_reset");
export const setAlias = (alias: string) => call("tnb_set_alias", { _alias: alias });

export async function leaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("tnb_leaderboard", { _limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? "anonymous",
    score: Number(row.score ?? 0),
  }));
}

export async function saveStats(combo: number, perfect: number, critical: number) {
  await supabase.rpc("tnb_stats", {
    _combo: Math.round(combo),
    _perfect: Math.round(perfect),
    _critical: Math.round(critical),
  });
}
