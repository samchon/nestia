import {
  IMetadataComponents,
  IMetadataSchema,
  OpenApi,
} from "@typia/interface";

import { MetadataFactory } from "../internal/legacy";
import { HttpResponseContentTypeUtil } from "../utils/HttpResponseContentTypeUtil";
import { IReflectType } from "./IReflectType";

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
