import type { HttpError as HttpErrorClass } from "@typia/utils";
import * as typiaUtils from "@typia/utils";

// Resolved through the namespace-or-default dance instead of a named
// re-export: the published @typia/utils `.mjs` currently exposes only a
// default export, so a named re-export crashes real ESM consumers, while the
// CJS build has no default at all. This shape works against both, and against
// the fixed upstream artifacts once they ship.
const unwrapped: typeof typiaUtils =
  (typiaUtils as { default?: typeof typiaUtils }).default ?? typiaUtils;

export const HttpError = unwrapped.HttpError;
export type HttpError = HttpErrorClass;
