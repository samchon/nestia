import { IJsDocTagInfo } from "typia";

import { IOperationMetadata } from "./IOperationMetadata";
import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

/**
 * Parameter descriptor for an MCP tool method. Reflected from
 * `"nestia/McpRoute/Parameters"` metadata plus compile-time type information
 * collected by the nestia transformer.
 *
 * @evidence contracts/common.md#principled-implementation A tool has at most one parameter, and the record is what the SDK needs to type it.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation IReflectMcpOperationParameter describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface IReflectMcpOperationParameter {
  category: "params";
  name: string;
  index: number;
  type: IReflectType;
  /** Native JSON wire analysis, retained independently of the source import. */
  metadata?: IOperationMetadata.IResponse["primitive"];
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}

export namespace IReflectMcpOperationParameter {
  /** @internal */
  export interface IPreconfigured {
    category: "params";
    index: number;
  }
}
