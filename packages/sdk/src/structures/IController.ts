import type { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";

import type { ParamCategory } from "./ParamCategory";

export interface IController {
    file: string;
    name: string;
    prefixes: string[];
    paths: string[];
    versions:
        | Array<Exclude<VersionValue, Array<string | typeof VERSION_NEUTRAL>>>
        | undefined;
    functions: IController.IFunction[];
    security: Record<string, string[]>[];
    swaggerTgas: string[];
}

export namespace IController {
    export interface IFunction {
        name: string;
        method: string;
        paths: string[];
        versions:
            | Array<
                  Exclude<VersionValue, Array<string | typeof VERSION_NEUTRAL>>
              >
            | undefined;
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
        swaggerTags: string[];
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
        contentType:
            | "application/json"
            | "application/x-www-form-urlencoded"
            | "text/plain";
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
