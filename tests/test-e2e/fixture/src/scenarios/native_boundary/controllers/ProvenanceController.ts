import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import type { ValidationError } from "../typia-error";

/**
 * Preserves the original source-private error with a typia-like name.
 *
 * This nonexported interface has only reason:string and is independent of the
 * actual typia declaration reexported by the sibling barrel.
 */
interface TypeGuardError {
  reason: string;
}

/**
 * Contrasts original local and imported exception provenance.
 *
 * @evidence contracts/common.md#principled-implementation The original409 local error and400 typia barrel alias must generate different schema references. The private interface contains reason:string while the original type-only ValidationError barrel reexports actual typia TypeGuardError; declaration ownership, not spelling, supplies the distinction.
 * @evidence contracts/common.md#clear-and-simple-design Two stateless endpoints preserve the original exception annotations. Their source-private interface and foreign type-only barrel are necessary independent declarations, not additional implementations or generated expected types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original private interface, imported alias and public decorators retain their meaning without fabricated metadata, exported replacement types or name-dependent product branches.
 * @evidence contracts/common.md#meaningful-documentation This owning class describes its private interface and foreign type-only barrel provenance; both declarations retain native prose while their unsupported standalone Evidence hosts are covered here.
 */
@Controller("native_boundary/provenance")
export class ProvenanceController {
  @core.TypedRoute.Get("typia")
  @core.TypedException<ValidationError>({ status: 400 })
  /**
   * Returns the original typia endpoint.
   *
   * @evidence contracts/common.md#principled-implementation The original400 exception annotation refers to the actual typia barrel alias independently of the success string.
   * @evidence contracts/common.md#clear-and-simple-design One endpoint keeps the source annotation and response separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  public typia(): string {
    return "ok";
  }

  @core.TypedRoute.Get("local")
  @core.TypedException<TypeGuardError>({ status: 409 })
  /**
   * Returns the original local endpoint.
   *
   * @evidence contracts/common.md#principled-implementation The original409 exception annotation refers to the source-private reason interface independently of the success string.
   * @evidence contracts/common.md#clear-and-simple-design One endpoint keeps the source annotation and response separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  public local(): string {
    return "ok";
  }
}
