import { VERSION_NEUTRAL } from "@nestjs/common";
import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectWebSocketOperationParameter } from "./IReflectWebSocketOperationParameter";

/**
 * A reflected WebSocket operation: its name, paths, function, versions,
 * parameters, and imports.
 *
 * @evidence contracts/common.md#principled-implementation The record joins the route metadata of the decorator with the compile-time metadata.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation IReflectWebSocketOperation describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface IReflectWebSocketOperation {
  protocol: "websocket";
  name: string;
  paths: string[];
  function: Function;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectWebSocketOperationParameter[];
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
