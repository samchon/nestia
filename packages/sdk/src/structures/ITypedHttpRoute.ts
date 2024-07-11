import ts from "typescript";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { IReflectController } from "./IReflectController";
import { IReflectHttpOperation } from "./IReflectHttpOperation";

export interface ITypedHttpRoute {
  protocol: "http";
  controller: IReflectController;
  function: Function;
  name: string;
  method: string;
  path: string;
  encrypted: boolean;
  status?: number;

  accessors: string[];
  parameters: ITypedHttpRoute.IParameter[];
  imports: [string, string[]][];
  output: ITypedHttpRoute.IOutput;

  location: string;
  description?: string;
  operationId?: string;
  jsDocTags: ts.JSDocTagInfo[];
  setHeaders: Array<
    | { type: "setter"; source: string; target?: string }
    | { type: "assigner"; source: string }
  >;
  security: Record<string, string[]>[];
  exceptions: Record<
    number | "2XX" | "3XX" | "4XX" | "5XX",
    ITypedHttpRoute.IOutput
  >;
  swaggerTags: string[];
}

export namespace ITypedHttpRoute {
  export type IParameter = IReflectHttpOperation.IParameter & {
    optional: boolean;
    type: ts.Type;
    typeName: string;
    metadata?: Metadata;
    description?: string;
    jsDocTags: ts.JSDocTagInfo[];
  };
  export interface IOutput {
    type: ts.Type;
    typeName: string;
    metadata?: Metadata;
    description?: string;
    contentType:
      | "application/x-www-form-urlencoded"
      | "application/json"
      | "text/plain";
  }
}
