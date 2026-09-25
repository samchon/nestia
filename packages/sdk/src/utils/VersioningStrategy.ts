import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

import { INestiaProject } from "../structures/INestiaProject";

export namespace VersioningStrategy {
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
