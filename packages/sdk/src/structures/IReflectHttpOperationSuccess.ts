import {
  IMetadataComponents,
  IMetadataSchema,
  OpenApi,
} from "@typia/interface";

import { MetadataFactory } from "../internal/legacy";
import { HttpResponseContentTypeUtil } from "../utils/HttpResponseContentTypeUtil";
import { IReflectType } from "./IReflectType";

/**
 * The reflected success response of an operation: its type, status, content
 * type, whether it is binary or encrypted, its schema, validator, and
 * examples.
 *
 * @evidence contracts/common.md#principled-implementation The record holds what the SDK and the Swagger generators need to describe the response.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface IReflectHttpOperationSuccess {
  type: IReflectType;
  status: number;
  contentType: HttpResponseContentTypeUtil.Response;
  binary: boolean;
  encrypted: boolean;
  components: IMetadataComponents;
  metadata: IMetadataSchema;
  validate?: MetadataFactory.Validator;
  example?: any;
  /** Named examples, as OpenAPI Example Objects. */
  examples?: Record<string, OpenApi.IExample>;
}
