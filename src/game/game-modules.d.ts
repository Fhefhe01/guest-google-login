// The core runtime and FX layers are plain JS ports of the original
// single-file build; these declarations give them a typed entry point.
declare module "@/game/core.js" {
  export function initGame(): void;
}

declare module "@/game/layers.js" {
  export function initLayers(): void;
}
