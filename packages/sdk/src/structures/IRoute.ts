import ts from "typescript";

import { IController } from "./IController";
import { ITypeTuple } from "./ITypeTuple";

export interface IRoute {
    name: string;
    method: string;
    path: string;
    encrypted: boolean;
    status?: number;

    parameters: IRoute.IParameter[];
    imports: [string, string[]][];
    output: IRoute.IOutput;

    location: string;
    symbol: string;
    description?: string;
    tags: ts.JSDocTagInfo[];
    setHeaders: Array<
        | { type: "setter"; source: string; target?: string }
        | { type: "assigner"; source: string }
    >;
    security: Record<string, string[]>[];
}

export namespace IRoute {
    export type IParameter = IController.IParameter & {
        optional: boolean;
        type: ITypeTuple;
    };
    export interface IOutput extends ITypeTuple {
        contentType: "application/json" | "text/plain";
    }
}
