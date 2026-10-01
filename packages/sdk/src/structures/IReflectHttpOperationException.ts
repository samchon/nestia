import {
  IMetadataComponents,
  IMetadataSchema,
  OpenApi,
} from "@typia/interface";

import { MetadataFactory } from "../internal/legacy";
import { IReflectType } from "./IReflectType";

/**
 * A reflected exception of an operation: its status, description, examples,
 * type, metadata, components, and validator.
 *
 * @evidence contracts/common.md#principled-implementation The declaration fields come from `@TypedException` and the reflected fields from the transform.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface IReflectHttpOperationException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example?: any;
  /** Named examples, as OpenAPI Example Objects. */
  examples?: Record<string, OpenApi.IExample>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: IMetadataSchema;
  components: IMetadataComponents;
  validate: MetadataFactory.Validator;
}
