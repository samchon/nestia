import type { VERSION_NEUTRAL } from "@nestjs/common/interfaces/index.js";

import { IReflectHttpOperation } from "./IReflectHttpOperation";
import { IReflectMcpOperation } from "./IReflectMcpOperation";
import { IReflectWebSocketOperation } from "./IReflectWebSocketOperation";

/**
 * A reflected controller: its class, its file, its paths, prefixes, versions,
 * security, tags, and operations.
 *
 * @evidence contracts/common.md#principled-implementation The record is the reflection result that the typed analysis consumes.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidence contracts/portability.md#os-neutral-implementation file carries the controller source pathname supplied by ConfigAnalyzer; paths and prefixes retain Nest router spelling independently of native separators.
 */
export interface IReflectController {
  class: Function;
  prefixes: string[];
  paths: string[];
  file: string;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  operations: Array<
    IReflectHttpOperation | IReflectWebSocketOperation | IReflectMcpOperation
  >;
  security: Record<string, string[]>[];
  tags: string[];
}
