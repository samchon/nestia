import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

/**
 * Resolves the URI versions of a controller method the way NestJS does.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns the version metadata of a controller and a method, with the default version of the application, into the version path segments, following NestJS's precedence.
 * @evidence contracts/common.md#clear-and-simple-design Two functions and one configuration type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence follows NestJS; no version string is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace VersioningStrategy {
  /**
   * The URI versioning options the adapter reads: the prefix and the default
   * version.
   *
   * @evidence contracts/common.md#principled-implementation The two fields are what NestJS's URI versioning uses to build a version segment.
   * @evidence contracts/common.md#clear-and-simple-design A two-field record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the two fields.
   */
  export interface IConfig {
    prefix: string;
    defaultVersion?: VersionValue;
  }

  /**
   * Casts version metadata to a list: a missing value stays absent and a single
   * value is a one-element list.
   *
   * @evidence contracts/common.md#principled-implementation One version becomes a list while absence and an explicit empty list remain distinct, because Nest treats an empty version list as no registered paths rather than inherited versions.
   * @evidence contracts/common.md#clear-and-simple-design One conditional expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds nothing to the values.
   * @evidence contracts/common.md#meaningful-documentation The comment states the three cases.
   */
  export const cast = (
    value: VersionValue | undefined,
  ): Array<string | typeof VERSION_NEUTRAL> | undefined =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value];

  /**
   * Version path segments of a route, resolved as NestJS resolves them: the
   * method's versions, else the controller's, else the default version, and no
   * version at all is the unversioned path (#1735).
   *
   * @evidence contracts/common.md#principled-implementation The first present method, controller or default version list wins, including an empty list that registers no paths. Duplicates are dropped, a neutral version maps to no segment, and absent metadata also maps to no segment; with versioning off the only path has no version.
   * @evidence contracts/common.md#clear-and-simple-design One function returning the segments, curried on the configuration so a caller can compute the segments per method.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The precedence is NestJS's, and no version is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states the precedence and the neutral version rule.
   */
  export const merge =
    (config: IConfig | undefined) =>
    (props: {
      controller: Array<string | typeof VERSION_NEUTRAL> | undefined;
      method: Array<string | typeof VERSION_NEUTRAL> | undefined;
    }): string[] => {
      if (config === undefined) return [""];
      const chosen: Array<string | typeof VERSION_NEUTRAL> | undefined =
        props.method ?? props.controller ?? cast(config.defaultVersion);
      if (chosen === undefined) return [""];
      const unique: Array<string | typeof VERSION_NEUTRAL> = [
        ...new Set(chosen),
      ];
      return unique.map((x) =>
        typeof x === "symbol" ? "" : `${config.prefix}${x}`,
      );
    };
}
