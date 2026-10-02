import { IJsDocTagInfo } from "typia";

import { MetadataSchema } from "../internal/legacy";
import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { IReflectMcpOperation } from "./IReflectMcpOperation";
import { IReflectMcpOperationParameter } from "./IReflectMcpOperationParameter";
import { IReflectType } from "./IReflectType";

/**
 * Final typed representation of an MCP tool route.
 *
 * Carries everything the SDK generator needs to emit a typed client function:
 * the controller reference, accessor path, typia-derived input schema, and
 * input/output type info.
 *
 * @evidence contracts/common.md#principled-implementation The record is the tool operation in the form the SDK generator reads.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ITypedMcpRoute describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface ITypedMcpRoute {
  protocol: "mcp";
  controller: IReflectController;
  name: string;
  toolName: string;
  title: string | null;
  toolDescription: string | null;
  accessor: string[];
  function: Function;
  input: IReflectMcpOperationParameter | null;
  returnType: IReflectType | null;
  /** Resolved JSON wire graphs used by structural DTO cloning. */
  inputMetadata?: MetadataSchema;

  /** Absent when source-only analysis was requested without cloning. */
  outputMetadata?: MetadataSchema;
  inputSchema: object;
  outputSchema: object | null;
  annotations: IReflectMcpOperation.IAnnotations | null;
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
