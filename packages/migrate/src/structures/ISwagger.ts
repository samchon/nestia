import { ISwaggerComponents } from "./ISwaggerComponents";
import { ISwaggerRoute } from "./ISwaggerRoute";

export interface ISwagger {
    openapi: `3.0.${number}`;
    info: ISwagger.IInfo;
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
    export interface IInfo {
        version: string;
        title: string;
        description?: string;
    }
    export type IPath = Record<string, ISwaggerRoute>;
}