import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

import { INestiaProject } from "../structures/INestiaProject";

/**
 * Resolves the URI versions of a controller method as NestJS does.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns version metadata and the default version into path segments.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence is NestJS's.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace VersioningStrategy {
  /**
   * Casts version metadata to a list: absent is empty and a single value is a
   * one-element list.
   *
   * @evidence contracts/common.md#principled-implementation Three shapes become one.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds nothing.
   * @evidence contracts/common.md#meaningful-documentation The comment states the cases.
   */
  export const cast = (
    value: VersionValue | undefined,
  ): Array<string | typeof VERSION_NEUTRAL> =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

  /**
   * Version path segments of a route, resolved as NestJS resolves them: the
   * method's versions, else the controller's, else the default version, and no
   * version at all is the unversioned path.
   *
   * The controller's and the method's versions were joined, so a method
   * overriding its controller's version was also described at the controller's,
   * and a route with no version and no default got no path at all (#1735).
   *
   * @evidence contracts/common.md#principled-implementation The first non-empty list wins, duplicates are removed, a neutral version has no segment, and with versioning off the only segment is empty.
   * @evidence contracts/common.md#clear-and-simple-design One curried function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence is NestJS's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the precedence.
   */
  export const merge =
    (project: Omit<INestiaProject, "config">) =>
    (props: {
      controller: Array<string | typeof VERSION_NEUTRAL> | undefined;
      method: Array<string | typeof VERSION_NEUTRAL> | undefined;
    }): string[] => {
      const versioning = project.input.versioning;
      if (versioning === undefined) return [""];
      const chosen: Array<string | typeof VERSION_NEUTRAL> = props.method
        ?.length
        ? props.method
        : props.controller?.length
          ? props.controller
          : cast(versioning.defaultVersion);
      const unique: Array<string | typeof VERSION_NEUTRAL> = [
        ...new Set(chosen),
      ];
      return unique.length
        ? unique.map((x) =>
            typeof x === "symbol" ? "" : `${versioning.prefix}${x}`,
          )
        : [""];
    };
}
