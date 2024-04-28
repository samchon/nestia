import { MetadataFactory } from "typia/lib/factories/MetadataFactory";

import { ITypedHttpRoute } from "./ITypedHttpRoute";

export interface ISwaggerError extends MetadataFactory.IError {
  route: ITypedHttpRoute;
  from: string;
}
