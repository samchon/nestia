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

    /**
     * @internal
     */
    controller: string;
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