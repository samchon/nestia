import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IJsonSchema = IJsonSchema.IEnumerationboolean | IJsonSchema.IEnumerationnumber | IJsonSchema.IEnumerationstring | IJsonSchema.IBoolean | IJsonSchema.IInteger | IJsonSchema.INumber | IJsonSchema.IString | IJsonSchema.IArray | IJsonSchema.ITuple | IJsonSchema.IOneOf | IJsonSchema.IReference | IJsonSchema.INullOnly | IJsonSchema.IUnknown;
export namespace IJsonSchema {
    export type IEnumerationboolean = {
        "enum": Array<boolean>;
        type: ("boolean");
        "default"?: undefined | boolean;
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IEnumerationnumber = {
        "enum": Array<number>;
        type: ("number");
        "default"?: undefined | number;
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IEnumerationstring = {
        "enum": Array<string>;
        type: ("string");
        "default"?: undefined | string;
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IBoolean = {
        "x-typia-typeTags"?: undefined | Array<IMetadataTypeTag>;
        "default"?: undefined | boolean;
        type: ("boolean");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IInteger = {
        minimum?: undefined | (number & Type<"int32">);
        maximum?: undefined | (number & Type<"int32">);
        exclusiveMinimum?: undefined | boolean;
        exclusiveMaximum?: undefined | boolean;
        multipleOf?: undefined | (number & Type<"int32">);
        "x-typia-typeTags"?: undefined | Array<IMetadataTypeTag>;
        "default"?: undefined | number;
        type: ("integer");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type INumber = {
        minimum?: undefined | number;
        maximum?: undefined | number;
        exclusiveMinimum?: undefined | boolean;
        exclusiveMaximum?: undefined | boolean;
        multipleOf?: undefined | number;
        "x-typia-typeTags"?: undefined | Array<IMetadataTypeTag>;
        "default"?: undefined | number;
        type: ("number");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IString = {
        minLength?: undefined | (number & Type<"uint32">);
        maxLength?: undefined | (number & Type<"uint32">);
        pattern?: undefined | string;
        format?: undefined | string;
        "x-typia-typeTags"?: undefined | Array<IMetadataTypeTag>;
        "default"?: undefined | string;
        type: ("string");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IArray = {
        items: IJsonSchema;
        minItems?: undefined | (number & Type<"uint32">);
        maxItems?: undefined | (number & Type<"uint32">);
        "x-typia-tuple"?: undefined | IJsonSchema.ITuple;
        type: ("array");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type ITuple = {
        items: Array<IJsonSchema>;
        minItems: (number & Type<"uint32">);
        maxItems?: undefined | (number & Type<"uint32">);
        type: ("array");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IOneOf = {
        oneOf: Array<IJsonSchema>;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IReference = {
        $ref: string;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type INullOnly = {
        type: ("null");
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
    export type IUnknown = {
        type?: undefined;
        deprecated?: undefined | boolean;
        title?: undefined | string;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-required"?: undefined | boolean;
        "x-typia-optional"?: undefined | boolean;
        "x-typia-rest"?: undefined | boolean;
    }
}