import ts from "typescript";

import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { IController } from "./IController";

export interface IRoute {
    name: string;
    method: string;
    path: string;
    encrypted: boolean;
    status?: number;

    accessors: string[];
    parameters: IRoute.IParameter[];
    imports: [string, string[]][];
    output: IRoute.IOutput;

    location: string;
    symbol: {
        class: string;
        function: string;
    };
    description?: string;
    operationId?: string;
    jsDocTags: ts.JSDocTagInfo[];
    setHeaders: Array<
        | { type: "setter"; source: string; target?: string }
        | { type: "assigner"; source: string }
    >;
    security: Record<string, string[]>[];
    exceptions: Record<number | "2XX" | "3XX" | "4XX" | "5XX", IRoute.IOutput>;
    swaggerTags: string[];
}

export namespace IRoute {
    export type IParameter = IController.IParameter & {
        optional: boolean;
        type: ts.Type;
        typeName: string;
        metadata?: Metadata;
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
