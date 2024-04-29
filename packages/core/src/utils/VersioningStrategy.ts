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

  export const merge =
    (config: IConfig | undefined) =>
    (values: Array<string | typeof VERSION_NEUTRAL>): string[] => {
      if (config === undefined) return [""];
      const set: Set<string | typeof VERSION_NEUTRAL> = new Set(values);
      const array: Array<string | typeof VERSION_NEUTRAL> =
        set.size === 0 ? cast(config.defaultVersion) : Array.from(set);
      return !!array?.length
        ? array.map((x) =>
            typeof x === "symbol" ? "" : `${config.prefix}${x}`,
          )
        : [];
    };
}
