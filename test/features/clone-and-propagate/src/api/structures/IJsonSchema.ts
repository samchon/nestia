import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IJsonSchema = IJsonSchema.IEnumerationboolean | IJsonSchema.IEnumerationnumber | IJsonSchema.IEnumerationstring | IJsonSchema.IBoolean | IJsonSchema.IInteger | IJsonSchema.INumber | IJsonSchema.IString | IJsonSchema.IArray | IJsonSchema.ITuple | IJsonSchema.IOneOf | IJsonSchema.IReference | IJsonSchema.INullOnly | IJsonSchema.IUnknown;
export namespace IJsonSchema {
    export type IEnumerationboolean = {
        "enum": Array<boolean>;
        type: ("boolean");
        "default"?: boolean;
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IEnumerationnumber = {
        "enum": Array<number>;
        type: ("number");
        "default"?: number;
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IEnumerationstring = {
        "enum": Array<string>;
        type: ("string");
        "default"?: string;
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IBoolean = {
        "x-typia-typeTags"?: Array<IMetadataTypeTag>;
        "default"?: boolean;
        type: ("boolean");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IInteger = {
        minimum?: (number & Type<"int32">);
        maximum?: (number & Type<"int32">);
        exclusiveMinimum?: boolean;
        exclusiveMaximum?: boolean;
        multipleOf?: (number & Type<"int32">);
        "x-typia-typeTags"?: Array<IMetadataTypeTag>;
        "default"?: number;
        type: ("integer");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type INumber = {
        minimum?: number;
        maximum?: number;
        exclusiveMinimum?: boolean;
        exclusiveMaximum?: boolean;
        multipleOf?: number;
        "x-typia-typeTags"?: Array<IMetadataTypeTag>;
        "default"?: number;
        type: ("number");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IString = {
        minLength?: (number & Type<"uint32">);
        maxLength?: (number & Type<"uint32">);
        pattern?: string;
        format?: string;
        "x-typia-typeTags"?: Array<IMetadataTypeTag>;
        "default"?: string;
        type: ("string");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IArray = {
        items: IJsonSchema;
        minItems?: (number & Type<"uint32">);
        maxItems?: (number & Type<"uint32">);
        "x-typia-tuple"?: IJsonSchema.ITuple;
        type: ("array");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type ITuple = {
        items: Array<IJsonSchema>;
        minItems: (number & Type<"uint32">);
        maxItems?: (number & Type<"uint32">);
        type: ("array");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IOneOf = {
        oneOf: Array<IJsonSchema>;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IReference = {
        $ref: string;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type INullOnly = {
        type: ("null");
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
    export type IUnknown = {
        type?: undefined;
        deprecated?: boolean;
        title?: string;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-required"?: boolean;
        "x-typia-optional"?: boolean;
        "x-typia-rest"?: boolean;
    }
}