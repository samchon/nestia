import { ISwaggerComponents } from "./ISwaggerComponents";
import { ISwaggerRoute } from "./ISwaggerRoute";

export interface ISwaggerDocument {
    openapi: `3.0.${number}`;
    servers: ISwaggerDocument.IServer[];
    info: ISwaggerDocument.IInfo;
    paths: Record<string, Record<string, ISwaggerRoute>>;
    components: ISwaggerComponents;
    security?: Record<string, string[]>[];
}
export namespace ISwaggerDocument {
    export interface IServer {
        url: string;
        description?: string;
    }

    export interface IInfo {
        version: string;
        title: string;
        description?: string;
    }
}
