/**
 * The landing's colors, mirroring the `--nestia-*` custom properties in
 * `src/app/global.css`.
 *
 * The landing is MUI, so it reads colors through `sx` rather than CSS vars,
 * and these are the same values written a second time in TypeScript. Change
 * one side and you must change the other.
 *
 * `VIVID` is the red NestJS itself paints with. It measures 4.30:1 on white,
 * below WCAG AA, so it is decoration only -- chips, borders, the bright end
 * of a gradient. Anything carrying text uses `RED` (6.40:1) or darker.
 */
export const PALETTE = {
  /** hsl(351, 72%, 42%) -- 6.40:1 on white. The Nextra primary anchor. */
  RED: "#b81e35",
  /** hsl(351, 74%, 30%) -- 9.88:1 on white. */
  RED_DEEP: "#851425",
  /** hsl(351, 70%, 47%) -- 5.41:1 on white. Lightest stop of the band. */
  RED_MID: "#cc243d",
  /** The literal NestJS brand red. Decoration only -- fails AA on white. */
  VIVID: "#ea2845",

  /** Body text. 17.95:1 on white. */
  INK: "#1f1417",
  /** Secondary text. 6.20:1 on white. */
  MUTED: "#705c61",

  SOFT: "#fdedef",
  WASH: "#fff7f8",
  BORDER: "#f2cad0",

  /**
   * The hero band. Every stop clears 4.5:1 for white text (9.88 / 6.40 /
   * 5.41), so a link is legible wherever the gradient happens to sit behind
   * it -- checking only the endpoints would leave the middle unverified.
   */
  BAND: "linear-gradient(110deg, #851425 0%, #b81e35 58%, #cc243d 100%)",
} as const;

/**
 * Syntax tones for the code panels, which sit on a near-black surface rather
 * than on white, so these are tuned against `#1f1417` and not reused from
 * the palette above.
 */
export const CODE = {
  SURFACE: "#221619",
  SURFACE_BAR: "#2c1d21",
  BORDER: "rgba(255, 255, 255, 0.10)",
  TEXT: "rgba(255, 255, 255, 0.85)",
  DIM: "rgba(255, 255, 255, 0.55)",
} as const;
