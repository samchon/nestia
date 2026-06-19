import { MetadataFactory } from "@typia/core";
import { IMetadataComponents, IMetadataSchema } from "@typia/interface";

import { IReflectType } from "./IReflectType";

export interface IReflectHttpOperationSuccess {
  type: IReflectType;
  status: number;
  contentType:
    | "application/json"
    | "text/plain"
    | "application/x-www-form-urlencoded"
    | "application/json"
    | null;
  encrypted: boolean;
  components: IMetadataComponents;
  metadata: IMetadataSchema;
  validate: MetadataFactory.Validator;
  example?: any;
  examples?: Record<string, any>;
}
