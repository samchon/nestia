import { MetadataFactory } from "../internal/legacy";

/**
 * Validator slot reserved for `@TypedHeaders` per-field SDK-side checks.
 * Returns `[]` because the typia native transform already enforces the
 * "atomic-or-array-of-atomic" constraint at compile time, and
 * `MetadataFactory.validate` — the only call site — is itself a passthrough on
 * the v13 runtime.
 */
export namespace HttpHeadersValidator {
  export const validate: MetadataFactory.Validator = () => [];
}
