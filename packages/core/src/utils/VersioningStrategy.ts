import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

export namespace VersioningStrategy {
  export interface IConfig {
    prefix: string;
    defaultVersion?: VersionValue;
  }

  export const cast = (
    value: VersionValue | undefined,
  ): Array<string | typeof VERSION_NEUTRAL> =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

  /**
   * Version path segments of a route, resolved as NestJS resolves them: the
   * method's versions, else the controller's, else the default version, and no
   * version at all is the unversioned path (#1735).
   */
  export const merge =
    (config: IConfig | undefined) =>
    (props: {
      controller: Array<string | typeof VERSION_NEUTRAL> | undefined;
      method: Array<string | typeof VERSION_NEUTRAL> | undefined;
    }): string[] => {
      if (config === undefined) return [""];
      const chosen: Array<string | typeof VERSION_NEUTRAL> = props.method
        ?.length
        ? props.method
        : props.controller?.length
          ? props.controller
          : cast(config.defaultVersion);
      const unique: Array<string | typeof VERSION_NEUTRAL> = [
        ...new Set(chosen),
      ];
      return unique.length
        ? unique.map((x) =>
            typeof x === "symbol" ? "" : `${config.prefix}${x}`,
          )
        : [""];
    };
}
