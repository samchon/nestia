import { ParamCategory } from "./ParamCategory";

export interface IController {
    file: string;
    name: string;
    paths: string[];
    functions: IController.IFunction[];
    security: Record<string, string[]>[];
}

export namespace IController {
    export interface IFunction {
        name: string;
        method: string;
        paths: string[];
        encrypted: boolean;
        parameters: IParameter[];
        status?: number;
        type?: string;
        contentType: "application/json" | "text/plain";
        security: Record<string, string[]>[];
        exceptions: Record<
            number | "2XX" | "3XX" | "4XX" | "5XX",
            IController.IException
        >;
    }

    export type IParameter =
        | ICommonParameter
        | IQueryParameter
        | IHeadersParameter
        | IBodyParameter
        | IPathParameter;
    export interface ICommonParameter {
        custom: false;
        category: ParamCategory;
        index: number;
        name: string;
        field: string | undefined;
    }
    export interface IHeadersParameter {
        custom: true;
        category: "headers";
        index: number;
        name: string;
        field: string | undefined;
    }
    export interface IQueryParameter {
        custom: true;
        category: "query";
        index: number;
        name: string;
        field: string | undefined;
    }
    export interface IBodyParameter {
        custom: true;
        category: "body";
        index: number;
        name: string;
        field: string | undefined;
        encrypted: boolean;
        contentType: "application/json" | "text/plain";
    }
    export interface IPathParameter {
        custom: true;
        category: "param";
        index: number;
        name: string;
        field: string | undefined;
    }

    export interface IException {
        type: string;
        status: number | "2XX" | "3XX" | "4XX" | "5XX";
        description: string | undefined;
    }
}
