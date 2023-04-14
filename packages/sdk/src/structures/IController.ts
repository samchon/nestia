import { ParamCategory } from "./ParamCategory";

export interface IController {
    file: string;
    name: string;
    paths: string[];
    functions: IController.IFunction[];
}

export namespace IController {
    export interface IFunction {
        name: string;
        method: string;
        paths: string[];
        encrypted: boolean;
        parameters: IParameter[];
        status?: number;
    }

    export interface IParameter {
        name: string;
        index: number;
        field: string | undefined;
        category: ParamCategory;
        encrypted: boolean;
    }
}
