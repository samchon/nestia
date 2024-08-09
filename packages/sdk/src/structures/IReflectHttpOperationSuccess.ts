import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";

import { IReflectType } from "./IReflectType";

export interface IReflectHttpOperationSuccess {
  components: IMetadataComponents;
  type: IReflectType;
  schema: IMetadata;
  status: number;
  contentType:
    | "application/json"
    | "text/plain"
    | "application/x-www-form-urlencoded"
    | "application/json"
    | null;
  encrypted: boolean;
  example?: any;
  examples?: Record<string, any>;
}
