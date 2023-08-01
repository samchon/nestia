import * as Constants from "@nestjs/common/constants";
import "reflect-metadata";
import { equal } from "tstl/ranges/module";

import { IController } from "../structures/IController";
import { ParamCategory } from "../structures/ParamCategory";
import { ArrayUtil } from "../utils/ArrayUtil";
import { PathAnalyzer } from "./PathAnalyzer";
import { SecurityAnalyzer } from "./SecurityAnalyzer";

type IModule = {
    [key: string]: any;
};

export namespace ReflectAnalyzer {
    export async function analyze(
        unique: WeakSet<any>,
        file: string,
    ): Promise<IController[]> {
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

        for (const tuple of Object.entries(module)) {
            if (unique.has(tuple[1])) continue;
            else unique.add(tuple[1]);

            const controller: IController | null = _Analyze_controller(
                file,
                ...tuple,
            );
            if (controller !== null) ret.push(controller);
        }
        return ret;
    }

    /* ---------------------------------------------------------
        CONTROLLER
    --------------------------------------------------------- */
    function _Analyze_controller(
        file: string,
        name: string,
        creator: any,
    ): IController | null {
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
        const paths: string[] = _Get_paths(
            Reflect.getMetadata(Constants.PATH_METADATA, creator),
        );
        const meta: IController = {
            file,
            name,
            paths,
            functions: [],
            security: _Get_security(creator),
        };

        // PARSE CHILDREN DATA
        for (const tuple of _Get_prototype_entries(creator)) {
            const child: IController.IFunction | null = _Analyze_function(
                creator.prototype,
                meta,
                ...tuple,
            );
            if (child !== null) meta.functions.push(child);
        }

        // RETURNS
        return meta;
    }

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

    function _Get_paths(value: string | string[]): string[] {
        if (typeof value === "string") return [value];
        else if (value.length === 0) return [""];
        else return value;
    }

    function _Get_security(value: any): Record<string, string[]>[] {
        const entire: Record<string, string[]>[] | undefined =
            Reflect.getMetadata("swagger/apiSecurity", value);
        return entire ? SecurityAnalyzer.merge(...entire) : [];
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    function _Analyze_function(
        classProto: any,
        controller: IController,
        name: string,
        proto: any,
    ): IController.IFunction | null {
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

        //----
        // CONSTRUCTION
        //----
        // BASIC INFO
        const meta: IController.IFunction = {
            name,
            method: METHODS[
                Reflect.getMetadata(Constants.METHOD_METADATA, proto)
            ],
            paths: _Get_paths(
                Reflect.getMetadata(Constants.PATH_METADATA, proto),
            ),
            parameters: [],
            encrypted:
                Reflect.getMetadata(Constants.INTERCEPTORS_METADATA, proto)?.[0]
                    ?.constructor?.name === "EncryptedRouteInterceptor",
            status: Reflect.getMetadata(Constants.HTTP_CODE_METADATA, proto),
            contentType:
                Reflect.getMetadata(Constants.HEADERS_METADATA, proto)?.find(
                    (h: Record<string, string>) =>
                        typeof h?.name === "string" &&
                        typeof h?.value === "string" &&
                        h.name.toLowerCase() === "content-type",
                )?.value ?? "application/json",
            security: _Get_security(proto),
        };

        // PARSE CHILDREN DATA
        const nestParameters: NestParameters | undefined = Reflect.getMetadata(
            Constants.ROUTE_ARGS_METADATA,
            classProto.constructor,
            name,
        );
        if (nestParameters === undefined) meta.parameters = [];
        else {
            for (const tuple of Object.entries(nestParameters)) {
                const child: IController.IParameter | null = _Analyze_parameter(
                    ...tuple,
                );
                if (child !== null) meta.parameters.push(child);
            }
            meta.parameters = meta.parameters.sort((x, y) => x.index - y.index);
        }

        // VALIDATE PATH ARGUMENTS
        for (const controllerLocation of controller.paths)
            for (const metaLocation of meta.paths) {
                // NORMALIZE LOCATION
                const location: string = PathAnalyzer.join(
                    controllerLocation,
                    metaLocation,
                );

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
                    throw new Error(
                        `Error on ${
                            controller.name
                        }.${name}(): binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
                            ", ",
                        )}], parameters: [${parameters.join(", ")}])`,
                    );
            }

        // RETURNS
        return meta;
    }

    const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

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
            param.factory.name === "TypedBody" ||
            param.factory.name === "EncryptedBody" ||
            param.factory.name === "PlainBody"
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
                meta: (() => {
                    const type = (param.factory as any).type;
                    const nullable = (param.factory as any).nullable;
                    if (type !== undefined && nullable !== undefined)
                        return {
                            type,
                            nullable,
                        };
                    return undefined;
                })(),
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
}
