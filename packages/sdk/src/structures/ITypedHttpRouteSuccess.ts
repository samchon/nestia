import { MetadataSchema } from "../internal/legacy";
import { HttpResponseContentTypeUtil } from "../utils/HttpResponseContentTypeUtil";
import { IReflectType } from "./IReflectType";

export interface ITypedHttpRouteSuccess {
  type: IReflectType;
  status: number | null;
  contentType: HttpResponseContentTypeUtil.Response;
  binary: boolean;
  encrypted: boolean;
  metadata: MetadataSchema;
  example?: any;
  examples?: Record<string, any>;
  setHeaders: Array<
    | { type: "setter"; source: string; target?: string }
    | { type: "assigner"; source: string }
  >;
}
