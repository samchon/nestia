import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";

import { IReflectType } from "./IReflectType";

export interface IReflectHttpOperationException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example?: any;
  examples?: Record<string, any>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: IMetadata;
  components: IMetadataComponents;
  validate: MetadataFactory.Validator;
}
