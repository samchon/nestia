import { MetadataFactory } from "../internal/legacy";

/**
 * Validator slot reserved for `@TypedQuery` per-field SDK-side checks. Returns
 * `[]` because the typia native transform already enforces the atomic-only
 * constraint at compile time, and `MetadataFactory.validate` — the only call
 * site — is itself a passthrough on the v13 runtime.
 */
export namespace HttpQueryValidator {
  export const validate: MetadataFactory.Validator = () => [];
}
