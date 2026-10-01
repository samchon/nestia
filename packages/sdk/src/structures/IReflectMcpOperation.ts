import { IJsDocTagInfo } from "typia";

import { IOperationMetadata } from "./IOperationMetadata";
import { IReflectImport } from "./IReflectImport";
import { IReflectMcpOperationParameter } from "./IReflectMcpOperationParameter";
import { IReflectType } from "./IReflectType";

/**
 * Reflected operation metadata for a method decorated with `@McpRoute`.
 *
 * Produced by {@link ReflectMcpOperationAnalyzer.analyze}; consumed by
 * {@link TypedMcpRouteAnalyzer.analyze} to produce the final
 * {@link ITypedMcpRoute}.
 *
 * @evidence contracts/common.md#principled-implementation The record joins the route metadata of the decorator with the compile-time metadata.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface IReflectMcpOperation {
  protocol: "mcp";
  name: string;
  toolName: string;
  title: string | null;
  toolDescription: string | null;
  inputSchema: object;
  outputSchema: object | null;
  annotations: IReflectMcpOperation.IAnnotations | null;
  function: Function;
  parameters: IReflectMcpOperationParameter[];
  returnType: IReflectType | null;
  /** Native JSON return analysis; optional for source-only reflected inputs. */
  returnMetadata?: IOperationMetadata.IResponse["primitive"];
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}

export namespace IReflectMcpOperation {
  /**
   * The behavior hints of a tool: read-only, destructive, idempotent, and
   * open-world.
   *
   * @evidence contracts/common.md#principled-implementation The four optional flags are the hints the MCP protocol defines.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IAnnotations {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  }
}
