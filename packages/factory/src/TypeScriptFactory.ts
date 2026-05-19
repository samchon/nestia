import * as implementation from "./factory/index";

// Value and type share the `TypeScriptFactory` name. The value is the
// factory namespace (object literal of `createXxxx` functions); the type
// is its exact shape so callers keep precise per-method signatures
// without falling back to `any`.
export type TypeScriptFactory = typeof implementation;
export const TypeScriptFactory: typeof implementation = implementation;
