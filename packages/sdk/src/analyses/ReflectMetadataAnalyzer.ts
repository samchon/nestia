import { VERSION_NEUTRAL } from "@nestjs/common";
import { PATH_METADATA, VERSION_METADATA } from "@nestjs/common/constants";
import { VersionValue } from "@nestjs/common/interfaces";

import { SecurityAnalyzer } from "./SecurityAnalyzer";

export namespace ReflectMetadataAnalyzer {
  export const paths = (target: Function): string[] => {
    const value: string | string[] = Reflect.getMetadata(PATH_METADATA, target);
    if (typeof value === "string") return [value];
    else if (value.length === 0) return [""];
    else return value;
  };

  export const securities = (value: any): Record<string, string[]>[] => {
    const entire: Record<string, string[]>[] | undefined = Reflect.getMetadata(
      "swagger/apiSecurity",
      value,
    );
    return entire ? SecurityAnalyzer.merge(...entire) : [];
  };

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
