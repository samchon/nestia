import { ParamCategory } from "./ParamCategory";

export interface IRoute
{
    name: string;
    method: string;
    path: string;
    encrypted: boolean;
    type: string;
    parameters: IRoute.IParameter[];
}

export namespace IRoute
{
    export interface IParameter
    {
        name: string;
        category: ParamCategory;
        field: string | undefined;
        encrypted: boolean;
        type: string;
    }
}