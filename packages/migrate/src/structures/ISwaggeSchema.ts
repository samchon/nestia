export type ISwaggerSchema =
    | ISwaggerSchema.IUnknown
    | ISwaggerSchema.INullOnly
    | ISwaggerSchema.IAnyOf
    | ISwaggerSchema.IOneOf
    | ISwaggerSchema.IBoolean
    | ISwaggerSchema.IInteger
    | ISwaggerSchema.INumber
    | ISwaggerSchema.IString
    | ISwaggerSchema.IArray
    | ISwaggerSchema.IObject
    | ISwaggerSchema.IReference;
export namespace ISwaggerSchema {
    export interface IUnknown extends IAttribute {
        type?: undefined;
    }
    export interface INullOnly extends IAttribute {
        type: "null";
    }

    export interface IAnyOf extends IAttribute {
        anyOf: ISwaggerSchema[];
    }
    export interface IOneOf extends IAttribute {
        oneOf: ISwaggerSchema[];
    }

    export interface IBoolean extends ISignificant<"boolean"> {
        default?: boolean;
        enum?: boolean[];
    }
    export interface IInteger extends ISignificant<"integer"> {
        /** @type int */ default?: number;
        /** @type int */ enum?: number[];
        /** @type int */ minimum?: number;
        /** @type int */ maximum?: number;
        /** @type int */ exclusiveMinimum?: boolean;
        /** @type int */ exclusiveMaximum?: boolean;
        /** @type uint */ multipleOf?: number;
    }
    export interface INumber extends ISignificant<"number"> {
        default?: number;
        enum?: number[];
        minimum?: number;
        maximum?: number;
        exclusiveMinimum?: boolean;
        exclusiveMaximum?: boolean;
        multipleOf?: number;
    }
    export interface IString extends ISignificant<"string"> {
        default?: string;
        enum?: string[];
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
        properties?: Record<string, ISwaggerSchema>;
        required?: string[];
        additionalProperties?: ISwaggerSchema | boolean;
        "x-typia-patternProperties"?: Record<string, ISwaggerSchema>;
    }

    export interface IReference extends IAttribute {
        $ref: string;
    }

    interface ISignificant<Type extends string> extends IAttribute {
        type: Type;
        nullable?: boolean;
    }
    interface IAttribute {
        title?: string;
        description?: string;
        deprecated?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
}
