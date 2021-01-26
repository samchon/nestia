import { ParamCategory } from "./ParamCategory";

export interface IController
{
    file: string;
    name: string;
    path: string;
    functions: IController.IFunction[];
}

export namespace IController
{
    export interface IFunction
    {
        name: string;
        method: string;
        path: string;
        encrypted: boolean;

        parameters: IParameter[];
    }

    export interface IParameter
    {
        index: number;
        field: string | undefined;
        category: ParamCategory;
        encrypted: boolean;
    }
}