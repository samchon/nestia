import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

import { INestiaProject } from "../structures/INestiaProject";

/**
 * Resolves the URI versions of a controller method as NestJS does.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns version metadata and the default version into path segments.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence is NestJS's.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation VersioningStrategy maps Nest version metadata to URI segments, which are protocol spelling rather than native file paths.
 */
export namespace VersioningStrategy {
  /**
   * Casts version metadata to a list: absence stays absent and a single value
   * is a one-element list.
   *
   * @evidence contracts/common.md#principled-implementation A single version becomes a list while absence stays distinct from an explicit empty list, which registers no paths rather than inheriting other versions.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds nothing.
   * @evidence contracts/common.md#meaningful-documentation The comment states the cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation VersioningStrategy.cast maps Nest version metadata to URI segments, which are protocol spelling rather than native file paths.
   */
  export const cast = (
    value: VersionValue | undefined,
  ): Array<string | typeof VERSION_NEUTRAL> | undefined =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value];

  /**
   * Version path segments of a route, resolved as NestJS resolves them: the
   * method's versions, else the controller's, else the default version, and no
   * version at all is the unversioned path.
   *
   * The controller's and the method's versions were joined, so a method
   * overriding its controller's version was also described at the controller's,
   * and a route with no version and no default got no path at all (#1735).
   *
   * @evidence contracts/common.md#principled-implementation The first present method, controller or default list wins, including an empty list that registers no paths. Duplicates are removed, neutral and absent versions have no segment, and with versioning off the only segment is empty.
   * @evidence contracts/common.md#clear-and-simple-design One curried function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence is NestJS's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the precedence.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation VersioningStrategy.merge maps Nest version metadata to URI segments, which are protocol spelling rather than native file paths.
   */
  export const merge =
    (project: Omit<INestiaProject, "config">) =>
    (props: {
      controller: Array<string | typeof VERSION_NEUTRAL> | undefined;
      method: Array<string | typeof VERSION_NEUTRAL> | undefined;
    }): string[] => {
      const versioning = project.input.versioning;
      if (versioning === undefined) return [""];
      const chosen: Array<string | typeof VERSION_NEUTRAL> | undefined =
        props.method ?? props.controller ?? cast(versioning.defaultVersion);
      if (chosen === undefined) return [""];
      const unique: Array<string | typeof VERSION_NEUTRAL> = [
        ...new Set(chosen),
      ];
      return unique.map((x) =>
        typeof x === "symbol" ? "" : `${versioning.prefix}${x}`,
      );
    };
}
