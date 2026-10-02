import { OpenApi } from "@typia/interface";

import { MetadataSchema } from "../internal/legacy";
import { HttpResponseContentTypeUtil } from "../utils/HttpResponseContentTypeUtil";
import { IReflectType } from "./IReflectType";

/**
 * A typed success response: its type, status, content type, binary and
 * encrypted flags, metadata, examples, and header directives.
 *
 * @evidence contracts/common.md#principled-implementation The header directives are the `@setHeader` and `@assignHeaders` tags, which the SDK function applies to the connection.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ITypedHttpRouteSuccess describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface ITypedHttpRouteSuccess {
  type: IReflectType;
  status: number | null;
  contentType: HttpResponseContentTypeUtil.Response;
  binary: boolean;
  encrypted: boolean;
  metadata: MetadataSchema;
  example?: any;
  /** Named examples, as OpenAPI Example Objects. */
  examples?: Record<string, OpenApi.IExample>;
  setHeaders: Array<
    | { type: "setter"; source: string; target?: string }
    | { type: "assigner"; source: string }
  >;
}
