import { RequestMethod } from "@nestjs/common";
import { VersionValue } from "@nestjs/common/interfaces";

export interface INestiaSdkInput {
  controllers: INestiaSdkInput.IController[];
  globalPrefix?: {
    prefix: string;
    exclude?: INestiaSdkInput.IGlobalPrefixExclude[];
  };
  versioning?: {
    prefix: string;
    defaultVersion?: VersionValue;
  };
}
export namespace INestiaSdkInput {
  export interface IController {
    class: Function;
    location: string;
    prefixes: string[];
  }
  export interface IGlobalPrefixExclude {
    path: string;
    method?: RequestMethod;
    requestMethod?: RequestMethod;
    pathRegex?: RegExp;
  }
}
