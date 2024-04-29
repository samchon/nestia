import { VERSION_NEUTRAL } from "@nestjs/common/interfaces";

import { ParamCategory } from "./ParamCategory";

export interface IReflectHttpOperation {
  protocol: "http";
  function: Function;
  name: string;
  method: string;
  paths: string[];
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  encrypted: boolean;
  parameters: IReflectHttpOperation.IParameter[];
  status?: number;
  type?: string;
  contentType: "application/json" | "text/plain";
  security: Record<string, string[]>[];
  exceptions: Record<
    number | "2XX" | "3XX" | "4XX" | "5XX",
    IReflectHttpOperation.IException
  >;
  swaggerTags: string[];
}
export namespace IReflectHttpOperation {
  export type IParameter =
    | ICommonParameter
    | IQueryParameter
    | IHeadersParameter
    | IBodyParameter
    | IPathParameter;
  export interface ICommonParameter {
    custom: false;
    category: ParamCategory;
    index: number;
    name: string;
    field: string | undefined;
  }
  export interface IHeadersParameter {
    custom: true;
    category: "headers";
    index: number;
    name: string;
    field: string | undefined;
  }
  export interface IQueryParameter {
    custom: true;
    category: "query";
    index: number;
    name: string;
    field: string | undefined;
  }
  export interface IBodyParameter {
    custom: true;
    category: "body";
    index: number;
    name: string;
    field: string | undefined;
    encrypted: boolean;
    contentType:
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";
  }
  export interface IPathParameter {
    custom: true;
    category: "param";
    index: number;
    name: string;
    field: string | undefined;
  }

  export interface IException {
    type: string;
    status: number | "2XX" | "3XX" | "4XX" | "5XX";
    description: string | undefined;
  }
}
