/**
 * Reexports the actual typia error under its original barrel alias.
 *
 * ValidationError resolves to typia TypeGuardError, independently of the local
 * same-spelled interface. This type-only barrel contains no implementation; its
 * declaration provenance is reviewed with ProvenanceController.
 */
export type { TypeGuardError as ValidationError } from "typia";
