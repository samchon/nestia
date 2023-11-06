import * as Constants from "@nestjs/common/constants";
import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";
import "reflect-metadata";
import { equal } from "tstl/ranges/module";

import { IController } from "../structures/IController";
import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { ParamCategory } from "../structures/ParamCategory";
import { ArrayUtil } from "../utils/ArrayUtil";
import { PathAnalyzer } from "./PathAnalyzer";
import { SecurityAnalyzer } from "./SecurityAnalyzer";

type IModule = {
    [key: string]: any;
};

export namespace ReflectAnalyzer {
    export const analyze =
        (project: INestiaProject) =>
        async (
            unique: WeakSet<any>,
            file: string,
            prefixes: string[],
            target?: Function,
        ): Promise<IController[]> => {
            const module: IModule = await (async () => {
                try {
                    return await import(file);
                } catch (exp) {
                    console.log(
                        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
                    );
                    console.log(`Error on "${file}" file. Check your code.`);
                    console.log(exp);
                    console.log(
                        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
                    );
                    process.exit(-1);
                }
            })();
            const ret: IController[] = [];

            for (const [key, value] of Object.entries(module)) {
                if (typeof value !== "function" || unique.has(value)) continue;
                else if ((target ?? value) !== value) continue;
                else unique.add(value);

                const result: IController | null = _Analyze_controller(project)(
                    file,
                    key,
                    value,
                    prefixes,
                );
                if (result !== null) ret.push(result);
            }
            return ret;
        };

    /* ---------------------------------------------------------
        CONTROLLER
    --------------------------------------------------------- */
    const _Analyze_controller =
        (project: INestiaProject) =>
        (
            file: string,
            name: string,
            creator: any,
            prefixes: string[],
        ): IController | null => {
            //----
            // VALIDATIONS
            //----
            // MUST BE TYPE OF A CREATOR WHO HAS THE CONSTRUCTOR
            if (
                !(
                    creator instanceof Function &&
                    creator.constructor instanceof Function
                )
            )
                return null;
            // MUST HAVE THOSE MATADATA
            else if (
                ArrayUtil.has(
                    Reflect.getMetadataKeys(creator),
                    Constants.PATH_METADATA,
                    Constants.HOST_METADATA,
                    Constants.SCOPE_OPTIONS_METADATA,
                ) === false
            )
                return null;

            //----
            // CONSTRUCTION
            //----
            // BASIC INFO
            const meta: IController = {
                file,
                name,
                functions: [],
                prefixes,
                paths: _Get_paths(creator).filter((str) => {
                    if (str.includes("*") === true) {
                        project.warnings.push({
                            file,
                            controller: name,
                            function: null,
                            message:
                                "@nestia/sdk does not compose wildcard controller.",
                        });
                        return false;
                    }
                    return true;
                }),
                versions: _Get_versions(creator),
                security: _Get_securities(creator),
                swaggerTgas:
                    Reflect.getMetadata("swagger/apiUseTags", creator) ?? [],
            };

            // PARSE CHILDREN DATA
            for (const tuple of _Get_prototype_entries(creator)) {
                const child: IController.IFunction | null = _Analyze_function(
                    project,
                )(creator.prototype, meta, ...tuple);
                if (child !== null) meta.functions.push(child);
            }

            // RETURNS
            return meta;
        };

    function _Get_prototype_entries(creator: any): Array<[string, unknown]> {
        const keyList = Object.getOwnPropertyNames(creator.prototype);
        const entries: Array<[string, unknown]> = keyList.map((key) => [
            key,
            creator.prototype[key],
        ]);

        const parent = Object.getPrototypeOf(creator);
        if (parent.prototype !== undefined)
            entries.push(..._Get_prototype_entries(parent));

        return entries;
    }

    function _Get_paths(target: any): string[] {
        const value: string | string[] = Reflect.getMetadata(
            Constants.PATH_METADATA,
            target,
        );
        if (typeof value === "string") return [value];
        else if (value.length === 0) return [""];
        else return value;
    }

    function _Get_versions(
        target: any,
    ):
        | Array<Exclude<VersionValue, Array<string | typeof VERSION_NEUTRAL>>>
        | undefined {
        const value: VersionValue | undefined = Reflect.getMetadata(
            Constants.VERSION_METADATA,
            target,
        );
        return value === undefined || Array.isArray(value) ? value : [value];
    }

    function _Get_securities(value: any): Record<string, string[]>[] {
        const entire: Record<string, string[]>[] | undefined =
            Reflect.getMetadata("swagger/apiSecurity", value);
        return entire ? SecurityAnalyzer.merge(...entire) : [];
    }

    function _Get_exceptions(
        value: any,
    ): Record<number | "2XX" | "3XX" | "4XX" | "5XX", IController.IException> {
        const entire: IController.IException[] | undefined =
            Reflect.getMetadata("nestia/TypedException", value);
        return Object.fromEntries(
            (entire ?? []).map((exp) => [exp.status, exp]),
        ) as Record<
            number | "2XX" | "3XX" | "4XX" | "5XX",
            IController.IException
        >;
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    const _Analyze_function =
        (project: INestiaProject) =>
        (
            classProto: any,
            controller: IController,
            name: string,
            proto: any,
        ): IController.IFunction | null => {
            //----
            // VALIDATIONS
            //----
            // MUST BE TYPE OF A FUNCTION
            if (!(proto instanceof Function)) return null;
            // MUST HAVE THOSE METADATE
            else if (
                ArrayUtil.has(
                    Reflect.getMetadataKeys(proto),
                    Constants.PATH_METADATA,
                    Constants.METHOD_METADATA,
                ) === false
            )
                return null;

            const errors: IErrorReport[] = [];

            //----
            // CONSTRUCTION
            //----
            // BASIC INFO
            const encrypted: boolean =
                Reflect.getMetadata(Constants.INTERCEPTORS_METADATA, proto)?.[0]
                    ?.constructor?.name === "EncryptedRouteInterceptor";
            const query: boolean =
                Reflect.getMetadata(Constants.INTERCEPTORS_METADATA, proto)?.[0]
                    ?.constructor?.name === "TypedQueryRouteInterceptor";
            const method: string =
                METHODS[Reflect.getMetadata(Constants.METHOD_METADATA, proto)];
            if (method === undefined || method === "OPTIONS") return null;

            const parameters: IController.IParameter[] = (() => {
                const nestParameters: NestParameters | undefined =
                    Reflect.getMetadata(
                        Constants.ROUTE_ARGS_METADATA,
                        classProto.constructor,
                        name,
                    );
                if (nestParameters === undefined) return [];

                const output: IController.IParameter[] = [];
                for (const tuple of Object.entries(nestParameters)) {
                    const child: IController.IParameter | null =
                        _Analyze_parameter(...tuple);
                    if (child !== null) output.push(child);
                }
                return output.sort((x, y) => x.index - y.index);
            })();

            // VALIDATE BODY
            const body: IController.IParameter | undefined = parameters.find(
                (param) => param.category === "body",
            );
            if (body !== undefined && (method === "GET" || method === "HEAD")) {
                errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: name,
                    message: `"body" parameter cannot be used in the "${method}" method.`,
                });
                return null;
            }

            // DO CONSTRUCT
            const meta: IController.IFunction = {
                name,
                method: method === "ALL" ? "POST" : method,
                paths: _Get_paths(proto).filter((str) => {
                    if (str.includes("*") === true) {
                        project.warnings.push({
                            file: controller.file,
                            controller: controller.name,
                            function: name,
                            message:
                                "@nestia/sdk does not compose wildcard method.",
                        });
                        return false;
                    }
                    return true;
                }),
                versions: _Get_versions(proto),
                parameters,
                status: Reflect.getMetadata(
                    Constants.HTTP_CODE_METADATA,
                    proto,
                ),
                encrypted,
                contentType: encrypted
                    ? "text/plain"
                    : query
                    ? "application/x-www-form-urlencoded"
                    : Reflect.getMetadata(
                          Constants.HEADERS_METADATA,
                          proto,
                      )?.find(
                          (h: Record<string, string>) =>
                              typeof h?.name === "string" &&
                              typeof h?.value === "string" &&
                              h.name.toLowerCase() === "content-type",
                      )?.value ?? "application/json",
                security: _Get_securities(proto),
                exceptions: _Get_exceptions(proto),
                swaggerTags: [
                    ...new Set([
                        ...controller.swaggerTgas,
                        ...(Reflect.getMetadata("swagger/apiUseTags", proto) ??
                            []),
                    ]),
                ],
            };

            // VALIDATE PATH ARGUMENTS
            for (const controllerLocation of controller.paths)
                for (const metaLocation of meta.paths) {
                    // NORMALIZE LOCATION
                    const location: string = PathAnalyzer.join(
                        controllerLocation,
                        metaLocation,
                    );
                    if (location.includes("*")) continue;

                    // LIST UP PARAMETERS
                    const binded: string[] = PathAnalyzer.parameters(
                        location,
                        () => `${controller.name}.${name}()`,
                    ).sort();

                    const parameters: string[] = meta.parameters
                        .filter((param) => param.category === "param")
                        .map((param) => param.field!)
                        .sort();

                    // DO VALIDATE
                    if (equal(binded, parameters) === false)
                        errors.push({
                            file: controller.file,
                            controller: controller.name,
                            function: name,
                            message: `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
                                ", ",
                            )}], parameters: [${parameters.join(", ")}]).`,
                        });
                }

            // RETURNS
            if (errors.length) {
                project.errors.push(...errors);
                return null;
            }
            return meta;
        };

    /* ---------------------------------------------------------
        PARAMETER
    --------------------------------------------------------- */
    function _Analyze_parameter(
        key: string,
        param: INestParam,
    ): IController.IParameter | null {
        const symbol: string = key.split(":")[0];
        if (symbol.indexOf("__custom") !== -1)
            return _Analyze_custom_parameter(param);

        const typeIndex: number = Number(symbol[0]);
        if (isNaN(typeIndex) === true) return null;

        const type: ParamCategory | undefined = NEST_PARAMETER_TYPES[typeIndex];
        if (type === undefined) return null;

        return {
            custom: false,
            name: key,
            category: type,
            index: param.index,
            field: param.data,
        };
    }

    function _Analyze_custom_parameter(
        param: INestParam,
    ): IController.IParameter | null {
        if (param.factory === undefined) return null;
        else if (
            param.factory.name === "EncryptedBody" ||
            param.factory.name === "PlainBody" ||
            param.factory.name === "TypedQueryBody" ||
            param.factory.name === "TypedBody"
        )
            return {
                custom: true,
                category: "body",
                index: param.index,
                name: param.name,
                field: param.data,
                encrypted: param.factory.name === "EncryptedBody",
                contentType:
                    param.factory.name === "PlainBody" ||
                    param.factory.name === "EncryptedBody"
                        ? "text/plain"
                        : param.factory.name === "TypedQueryBody"
                        ? "application/x-www-form-urlencoded"
                        : "application/json",
            };
        else if (param.factory.name === "TypedHeaders")
            return {
                custom: true,
                category: "headers",
                name: param.name,
                index: param.index,
                field: param.data,
            };
        else if (param.factory.name === "TypedParam")
            return {
                custom: true,
                category: "param",
                name: param.name,
                index: param.index,
                field: param.data,
            };
        else if (param.factory.name === "TypedQuery")
            return {
                custom: true,
                name: param.name,
                category: "query",
                index: param.index,
                field: undefined,
            };
        else return null;
    }

    type NestParameters = {
        [key: string]: INestParam;
    };

    interface INestParam {
        name: string;
        index: number;
        factory?: (...args: any) => any;
        data: string | undefined;
    }
}

// node_modules/@nestjs/common/lib/enums/request-method.enum.ts
const METHODS = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "ALL",
    "OPTIONS",
    "HEAD",
];

// node_modules/@nestjs/common/lib/route-paramtypes.enum.ts
const NEST_PARAMETER_TYPES = [
    undefined,
    undefined,
    undefined,
    "body",
    "query",
    "param",
    "headers",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
] as const;
