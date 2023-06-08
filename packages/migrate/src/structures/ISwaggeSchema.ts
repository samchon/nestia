export type ISwaggerSchema = 
    // union types
    ISwaggerSchema.IAnyOf |
    ISwaggerSchema.IOneOf |
    // atomic types
    ISwaggerSchema.IBoolean |
    ISwaggerSchema.INumber |
    ISwaggerSchema.IString |
    // instance types
    ISwaggerSchema.IArray |
    ISwaggerSchema.IObject |
    ISwaggerSchema.IRecursive |
    // any type
    ISwaggerSchema.IUnknown;
export namespace ISwaggerSchema {
    export interface IAnyOf extends IAttribute {
        anyOf: ISwaggerSchema[];
    }
    export interface IOneOf extends IAttribute {
        oneOf: ISwaggerSchema[];
    }

    export interface IBoolean extends ISignificant<"boolean"> {
        default?: boolean;
    }
    export interface IInteger extends ISignificant<"integer"> {
        default?: number;
        /** @type int */ minimum?: number;
        /** @type int */ maximum?: number;
        /** @type int */ exclusiveMinimum?: boolean;
        /** @type int */ exclusiveMaximum?: boolean;
        /** @type uint */ multipleOf?: number;
    }
    export interface INumber extends ISignificant<"number"> {
        default?: number;
        minimum?: number;
        maximum?: number;
        exclusiveMinimum?: boolean;
        exclusiveMaximum?: boolean;
        multipleOf?: number;
    }
    export interface IString extends ISignificant<"string"> {
        default?: string;
        format?: string;
        pattern?: string;
        /** @type uint */ minLength?: number;
        /** @type uint */ maxLength?: number;
    }

    export interface IArray extends ISignificant<"array"> {
        items: ISwaggerSchema;
        /** @type uint */ minItems?: number;
        /** @type uint */ maxItems?: number;
        "x-typia-tuple"?: ITuple;
    }
    export interface ITuple extends ISignificant<"array"> {
        items: ISwaggerSchema[];
    }
    export interface IObject extends ISignificant<"object"> {
        properties: Record<string, ISwaggerSchema>;
        required?: string[];
        additionalProperties?: ISwaggerSchema | boolean;
        "x-typia-patternProperties"?: Record<string, ISwaggerSchema>;
    }

    export interface IRecursive extends IAttribute {
        $ref: string;
    }
    export interface IUnknown extends IAttribute {
        type?: undefined;
    }

    interface ISignificant<Type extends string> extends IAttribute {
        type: Type;
        nullable?: boolean;
    }
    interface IAttribute {
        title?: string;
        description?: string;
        deprecated?: boolean;
    }
}