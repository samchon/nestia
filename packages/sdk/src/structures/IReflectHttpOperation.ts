import { VERSION_NEUTRAL } from "@nestjs/common/interfaces";
import { IJsDocTagInfo } from "typia";

import { IReflectHttpOperationException } from "./IReflectHttpOperationException";
import { IReflectHttpOperationParameter } from "./IReflectHttpOperationParameter";
import { IReflectHttpOperationSuccess } from "./IReflectHttpOperationSuccess";
import { IReflectImport } from "./IReflectImport";

/**
 * A reflected HTTP operation: its function, name, method, paths, versions,
 * parameters, success, exceptions, security, tags, imports, and description.
 *
 * @evidence contracts/common.md#principled-implementation The record joins Nest's runtime metadata with the compile-time metadata of the transform.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface IReflectHttpOperation {
  protocol: "http";
  function: Function;
  name: string;
  method: string;
  paths: string[];
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectHttpOperationParameter[];
  success: IReflectHttpOperationSuccess;
  exceptions: Record<string, IReflectHttpOperationException>;
  security: Record<string, string[]>[];
  tags: string[];
  imports: IReflectImport[];
  operationId: string | undefined;
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
  extensions?: Record<string, any>;
}
