import {
  IMetadataComponents,
  IMetadataSchema,
  OpenApi,
} from "@typia/interface";

import { MetadataFactory } from "../internal/legacy";
import { IReflectType } from "./IReflectType";

export interface IReflectHttpOperationException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example?: any;
  /** Named examples, as OpenAPI Example Objects. */
  examples?: Record<string, OpenApi.IExample>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: IMetadataSchema;
  components: IMetadataComponents;
  validate: MetadataFactory.Validator;
}
