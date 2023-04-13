import ts from "typescript";

import { ITypeTuple } from "./ITypeTuple";
import { ParamCategory } from "./ParamCategory";

export interface IRoute {
    name: string;
    method: string;
    path: string;
    encrypted: boolean;
    status?: number;

    parameters: IRoute.IParameter[];
    imports: [string, string[]][];
    output: ITypeTuple;

    symbol: string;
    comments: ts.SymbolDisplayPart[];
    tags: ts.JSDocTagInfo[];
    setHeaders: Array<
        | { type: "setter"; source: string; target?: string }
        | { type: "assigner"; source: string }
    >;
}

export namespace IRoute {
    export interface IParameter {
        name: string;
        field: string | undefined;
        category: ParamCategory;
        encrypted: boolean;
        type: ITypeTuple;
        optional: boolean;
    }
}
