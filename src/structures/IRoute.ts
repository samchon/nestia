import ts from "typescript";
import { IType } from "./IType";
import { ParamCategory } from "./ParamCategory";

export interface IRoute {
    name: string;
    method: string;
    path: string;
    encrypted: boolean;

    parameters: IRoute.IParameter[];
    imports: [string, string[]][];
    output: IType;

    symbol: string;
    comments: ts.SymbolDisplayPart[];
    tags: ts.JSDocTagInfo[];
}

export namespace IRoute {
    export interface IParameter {
        name: string;
        field: string | undefined;
        category: ParamCategory;
        encrypted: boolean;
        type: IType;
    }
}
