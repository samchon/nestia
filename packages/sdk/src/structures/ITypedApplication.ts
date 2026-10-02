import { IMetadataDictionary } from "../internal/legacy";
import { INestiaProject } from "./INestiaProject";
import { ITypedHttpRoute } from "./ITypedHttpRoute";
import { ITypedMcpRoute } from "./ITypedMcpRoute";
import { ITypedWebSocketRoute } from "./ITypedWebSocketRoute";

/**
 * The typed application: the project, the metadata dictionary, and the typed
 * routes.
 *
 * @evidence contracts/common.md#principled-implementation The record is the input of every generator.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ITypedApplication describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface ITypedApplication {
  project: INestiaProject;
  collection: IMetadataDictionary;
  routes: Array<ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute>;
}
