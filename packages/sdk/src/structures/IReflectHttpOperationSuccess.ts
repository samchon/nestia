import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";

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
  metadata: IMetadata;
  validate: MetadataFactory.Validator;
  example?: any;
  examples?: Record<string, any>;
}
