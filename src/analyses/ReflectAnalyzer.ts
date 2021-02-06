import { ArrayUtil } from "../utils/ArrayUtil";

import { IController } from "../structures/IController";

type IModule =
{
    [key: string]: any;
}

export namespace ReflectAnalyzer
{
    export async function analyze(unique: WeakSet<any>, file: string): Promise<IController[]>
    {
        const module: IModule = await import(file);
        const ret: IController[] = [];

        for (const tuple of Object.entries(module))
        {
            if (unique.has(tuple[1]))
                continue;
            else
                unique.add(tuple[1]);

            const controller: IController | null = _Analyze_controller(file, ...tuple);
            if (controller !== null)
                ret.push(controller);
        }
        return ret;
    }

    /* ---------------------------------------------------------
        CONTROLLER
    --------------------------------------------------------- */
    function _Analyze_controller(file: string, name: string, creator: any): IController | null
    {
        //----
        // VALIDATIONS
        //----
        // MUST BE TYPE OF A CREATOR WHO HAS THE CONSTRUCTOR
        if (!(creator instanceof Function && creator.constructor instanceof Function))
            return null;

        // MUST HAVE THOSE MATADATA
        else if (ArrayUtil.has(Reflect.getMetadataKeys(creator), "path", "host", "scope:options") === false)
            return null;

        //----
        // CONSTRUCTION
        //----
        // BASIC INFO
        const meta: IController = {
            file,
            name,
            path: Reflect.getMetadata("path", creator),
            functions: []
        };

        // PARSE CHILDREN DATA
        for (const tuple of _Get_prototype_entries(creator))
        {
            const child: IController.IFunction | null = _Analyze_function(creator.prototype, ...tuple);
            if (child !== null)
                meta.functions.push(child);
        }

        // RETURNS
        return meta;
    }

    function _Get_prototype_entries(creator: any): Array<[string, unknown]>
    {
        const tuple = Object.entries(creator.prototype);
        const parent = Object.getPrototypeOf(creator);

        if (parent.prototype !== undefined)
            tuple.push(..._Get_prototype_entries(parent));

        return tuple;
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    function _Analyze_function(classProto: any, name: string, proto: any): IController.IFunction | null
    {
        //----
        // VALIDATIONS
        //----
        // MUST BE TYPE OF A FUNCTION
        if (!(proto instanceof Function))
            return null;

        // MUST HAVE THOSE METADATE
        else if (ArrayUtil.has(Reflect.getMetadataKeys(proto), "path", "method") === false)
            return null;

        //----
        // CONSTRUCTION
        //----
        // BASIC INFO
        const meta: IController.IFunction = {
            name,
            method: METHODS[Reflect.getMetadata("method", proto)],
            path: Reflect.getMetadata("path", proto),
            parameters: [],
            encrypted: Reflect.hasMetadata("encryption", proto)
        };

        // PARSE CHILDREN DATA
        const nestParameters: NestParameters =  Reflect.getMetadata("__routeArguments__", classProto.constructor, name);
        for (const tuple of Object.entries(nestParameters))
        {
            const child: IController.IParameter | null = _Analyze_parameter(...tuple);
            if (child !== null)
                meta.parameters.push(child);
        }
        meta.parameters = meta.parameters.sort((x, y) => x.index - y.index);

        // RETURNS
        return meta;
    }

    const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    /* ---------------------------------------------------------
        PARAMETER
    --------------------------------------------------------- */
    function _Analyze_parameter(key: string, param: INestParam): IController.IParameter | null
    {
        const symbol: string = key.split(":")[0];
        if (symbol.indexOf("__custom") !== -1)
            return _Analyze_custom_parameter(param);

        const typeIndex: number = Number(symbol[0]);
        if (isNaN(typeIndex) === true)
            return null;

        const type = NEST_PARAMETER_TYPES[typeIndex];
        if (type === undefined)
            return null;

        return {
            category: type,
            index: param.index,
            field: param.data,
            encrypted: false
        }
    }

    function _Analyze_custom_parameter(param: INestParam): IController.IParameter | null
    {
        if (param.factory === undefined)
            return null;
        else if (param.factory.name === "EncryptedBody")
            return {
                category: "body",
                index: param.index,
                field: param.data,
                encrypted: true
            };
        else if (param.factory.name === "TypedParam")
            return {
                category: "param",
                index: param.index,
                field: param.data,
                encrypted: false
            };
        else if (param.factory.name === "TypedQuery")
            return {
                category: "query",
                index: param.index,
                field: param.data,
                encrypted: false
            };
        else
            return null;
    }

    type NestParameters = {
        [key: string]: INestParam;
    }

    interface INestParam
    {
        index: number;
        factory?: Function;
        data: string | undefined;
    }

    const NEST_PARAMETER_TYPES = [
        undefined, 
        undefined, 
        undefined, 
        "body", 
        "query",
        "param",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    ] as const;
}