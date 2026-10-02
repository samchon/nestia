import { RequestMethod } from "@nestjs/common";
import { VersionValue } from "@nestjs/common/interfaces";

/**
 * The analyzed input: the controllers, the global prefix with its exclusions,
 * and the URI versioning options.
 *
 * @evidence contracts/common.md#principled-implementation The record is the common result of compiling sources and of reading a running application.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidence contracts/portability.md#os-neutral-implementation Controller location is a native source pathname supplied by ConfigAnalyzer; prefixes, exclusions and versions are router protocol strings, not filesystem paths.
 */
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
  /**
   * A controller class with its source file and the module prefixes it is
   * mounted under.
   *
   * @evidence contracts/common.md#principled-implementation The three members are what the reflection needs to analyze one controller and to report its errors by file.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidence contracts/portability.md#os-neutral-implementation location carries the native source pathname resolved by ConfigAnalyzer, while prefixes are HTTP mount paths; the two representations are not normalized together.
   */
  export interface IController {
    class: Function;
    location: string;
    prefixes: string[];
  }
  /**
   * A route excluded from the global prefix, by path, or by pattern, and
   * optionally by request method.
   *
   * @evidence contracts/common.md#principled-implementation The members mirror NestJS's exclusion entry, so the same match decides here and in the server.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation INestiaSdkInput.IGlobalPrefixExclude describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface IGlobalPrefixExclude {
    path: string;
    method?: RequestMethod;
    requestMethod?: RequestMethod;
    pathRegex?: RegExp;
  }
}
