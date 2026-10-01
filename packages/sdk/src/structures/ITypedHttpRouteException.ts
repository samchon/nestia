import { OpenApi } from "@typia/interface";

import { MetadataSchema } from "../internal/legacy";
import { IReflectType } from "./IReflectType";

/**
 * A typed exception: its status, description, examples, type, and resolved
 * metadata.
 *
 * @evidence contracts/common.md#principled-implementation The resolved metadata is what the SDK and the Swagger generators print.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface ITypedHttpRouteException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example: any;
  /** Named examples, as OpenAPI Example Objects. */
  examples: Record<string, OpenApi.IExample>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: MetadataSchema;
}
