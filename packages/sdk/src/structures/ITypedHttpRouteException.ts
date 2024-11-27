import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { IReflectType } from "./IReflectType";

export interface ITypedHttpRouteException {
  // BASIC PROPERTIES
  status: number | "2XX" | "3XX" | "4XX" | "5XX";
  description: string | null;
  example: any;
  examples: Record<string, any>;

  // REFLECTED PROPERTIES
  type: IReflectType;
  metadata: Metadata;
}
