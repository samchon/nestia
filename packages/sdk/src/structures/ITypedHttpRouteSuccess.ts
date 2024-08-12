import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { IReflectType } from "./IReflectType";

export interface ITypedHttpRouteSuccess {
  type: IReflectType;
  status: number | null;
  contentType:
    | "application/json"
    | "text/plain"
    | "application/x-www-form-urlencoded"
    | "application/json"
    | null;
  encrypted: boolean;
  metadata: Metadata;
  example?: any;
  examples?: Record<string, any>;
  setHeaders: Array<
    | { type: "setter"; source: string; target?: string }
    | { type: "assigner"; source: string }
  >;
}
