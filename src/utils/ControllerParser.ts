import { IController } from "../structures/IController";
import { ArrayUtil } from "./ArrayUtil";

type IModule =
{
    [key: string]: any;
}

export namespace ControllerParser
{
    export async function parse(file: string): Promise<IController[]>
    {
        const module: IModule = await import(file);
        const ret: IController[] = [];

        for (const tuple of Object.entries(module))
        {
            const controller: IController | null = _Parse_controller(file, ...tuple);
            if (controller !== null)
                ret.push(controller);
        }
        console.log(JSON.stringify(ret, null, 4));
        return ret;
    }

    /* ---------------------------------------------------------
        CONTROLLER
    --------------------------------------------------------- */
    function _Parse_controller(file: string, name: string, creator: any): IController | null
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
            methods: []
        };

        // PARSE CHILDREN DATA
        for (const tuple of Object.entries(creator.prototype))
        {
            const child: IController.IFunction | null = _Parse_function(creator.prototype, ...tuple);
            if (child !== null)
                meta.methods.push(child);
        }

        // RETURNS
        return meta;
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    function _Parse_function(classProto: any, name: string, proto: any): IController.IFunction | null
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
            const child: IController.IParameter | null = _Parse_parameter(...tuple);
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
    function _Parse_parameter(key: string, param: INestParam): IController.IParameter | null
    {
        const symbol: string = key.split(":")[0];
        if (symbol.indexOf("__custom") !== -1)
            return _Parse_custom_parameter(param);

        const typeIndex: number = Number(symbol[0]);
        if (isNaN(typeIndex) === true)
            return null;

        const type = NEST_PARAMETER_TYPES[typeIndex];
        if (type === undefined)
            return null;

        return {
            type,
            index: param.index,
            field: param.data,
            encrypted: false
        }
    }

    function _Parse_custom_parameter(param: INestParam): IController.IParameter | null
    {
        if (param.factory === undefined)
            return null;
        else if (param.factory.name === "EncryptedBody")
            return {
                type: "body",
                index: param.index,
                field: param.data,
                encrypted: true
            };
        else if (param.factory.name === "TypedParam")
            return {
                type: "param",
                index: param.index,
                field: param.data,
                encrypted: false
            };
        else if (param.factory.name === "TypedQuery")
            return {
                type: "query",
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