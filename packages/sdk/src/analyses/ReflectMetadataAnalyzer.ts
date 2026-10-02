import { VERSION_NEUTRAL } from "@nestjs/common";
import { PATH_METADATA, VERSION_METADATA } from "@nestjs/common/constants";
import { VersionValue } from "@nestjs/common/interfaces";

import { SecurityAnalyzer } from "./SecurityAnalyzer";

/**
 * Reads the NestJS and Swagger metadata of a class or method.
 *
 * @evidence contracts/common.md#principled-implementation The functions read the reflect metadata keys that Nest and `@nestjs/swagger` define and normalize them into arrays.
 * @evidence contracts/common.md#clear-and-simple-design Four small readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts They read only public metadata keys.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMetadataAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace ReflectMetadataAnalyzer {
  /**
   * Returns the path list of a controller or route: a string is a one-element
   * list and an empty list is one empty path.
   *
   * @evidence contracts/common.md#principled-implementation Nest stores a path as a string or an array, and an empty array means the root path, so the result is never empty.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It normalizes without changing paths.
   * @evidence contracts/common.md#meaningful-documentation The comment states the normalization.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMetadataAnalyzer.paths analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const paths = (target: Function): string[] => {
    const value: string | string[] = Reflect.getMetadata(PATH_METADATA, target);
    if (typeof value === "string") return [value];
    else if (value.length === 0) return [""];
    else return value;
  };

  /**
   * Returns the `@ApiExtension` values of a target.
   *
   * @evidence contracts/common.md#principled-implementation The metadata is returned as recorded, and an absent value is an empty object.
   * @evidence contracts/common.md#clear-and-simple-design One read.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the Swagger metadata key.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMetadataAnalyzer.extensions analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const extensions = (value: any): Record<string, any> => {
    const entire: Record<string, any>[] | undefined = Reflect.getMetadata(
      "swagger/apiExtension",
      value,
    );
    return entire ?? {};
  };

  /**
   * Returns the deduplicated security requirements of a target.
   *
   * @evidence contracts/common.md#principled-implementation The `@ApiSecurity` metadata is merged by `SecurityAnalyzer.merge`, and an absent value is an empty list.
   * @evidence contracts/common.md#clear-and-simple-design One read and one merge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the Swagger metadata key.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMetadataAnalyzer.securities analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const securities = (value: any): Record<string, string[]>[] => {
    const entire: Record<string, string[]>[] | undefined = Reflect.getMetadata(
      "swagger/apiSecurity",
      value,
    );
    return entire ? SecurityAnalyzer.merge(...entire) : [];
  };

  /**
   * Returns the version list of a target, or `undefined` when it is
   * unversioned.
   *
   * @evidence contracts/common.md#principled-implementation A single version becomes a one-element list, and an absent value stays absent so callers can tell unversioned from versioned.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads Nest's version metadata.
   * @evidence contracts/common.md#meaningful-documentation The comment states the three cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMetadataAnalyzer.versions analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const versions = (
    target: any,
  ): Array<string | typeof VERSION_NEUTRAL> | undefined => {
    const value: VersionValue | undefined = Reflect.getMetadata(
      VERSION_METADATA,
      target,
    );
    return value === undefined
      ? undefined
      : Array.isArray(value)
        ? value
        : [value];
  };
}
