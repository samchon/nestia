import type tsc from "typescript";
import { ParamCategory } from "./ParamCategory";

export interface IRoute
{
    name: string;
    method: string;
    path: string;
    encrypted: boolean;
    
    parameters: IRoute.IParameter[];
    imports: [string, string[]][];
    output: string;

    symbol: string;
    comments: tsc.SymbolDisplayPart[];
    tags: tsc.JSDocTagInfo[];
}

export namespace IRoute
{
    export interface IParameter
    {
        name: string;
        field: string | undefined;
        category: ParamCategory;
        encrypted: boolean;
        type: string;
    }
}