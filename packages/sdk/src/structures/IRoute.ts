import ts from "typescript";

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
    symbol: string;
    description?: string;
    operationId?: string;
    tags: ts.JSDocTagInfo[];
    setHeaders: Array<
        | { type: "setter"; source: string; target?: string }
        | { type: "assigner"; source: string }
    >;
    security: Record<string, string[]>[];
    exceptions: Record<number | "2XX" | "3XX" | "4XX" | "5XX", IRoute.IOutput>;
}

export namespace IRoute {
    export type IParameter = IController.IParameter & {
        optional: boolean;
        type: ts.Type;
        typeName: string;
    };
    export interface IOutput {
        type: ts.Type;
        typeName: string;
        description?: string;
        contentType: "application/json" | "text/plain";
    }
}
