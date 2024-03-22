import { ISwaggerComponents } from "./ISwaggerComponents";
import { ISwaggerInfo } from "./ISwaggerInfo";
import { ISwaggerRoute } from "./ISwaggerRoute";

export interface ISwagger {
  openapi: `3.0.${number}`;
  info: ISwaggerInfo;
  servers: ISwagger.IServer[];

  components: ISwaggerComponents;
  paths: Record<string, ISwagger.IPath>;
  security?: Record<string, string[]>[];
}
export namespace ISwagger {
  export interface IServer {
    url: string;
    description?: string;
  }
  export type IPath = Record<
    "get" | "post" | "patch" | "put" | "delete",
    ISwaggerRoute | undefined
  >;
}
