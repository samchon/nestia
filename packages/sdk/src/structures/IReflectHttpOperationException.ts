import { MetadataFactory } from "@typia/core";
import { IMetadataComponents, IMetadataSchema } from "@typia/interface";

import { IReflectType } from "./IReflectType";

export interface IReflectHttpOperationException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example?: any;
  examples?: Record<string, any>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: IMetadataSchema;
  components: IMetadataComponents;
  validate: MetadataFactory.Validator;
}
