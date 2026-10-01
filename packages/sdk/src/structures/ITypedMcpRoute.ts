import { IJsDocTagInfo } from "typia";

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
  inputSchema: object;
  outputSchema: object | null;
  annotations: IReflectMcpOperation.IAnnotations | null;
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
