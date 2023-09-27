import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";
import type { RecordstringIJsonSchema } from "./RecordstringIJsonSchema";

export namespace IJsonComponents {
    export type IObject = {
        $id?: undefined | string;
        type: ("object");
        /**
         * Only when swagger mode.
         */
        nullable?: undefined | boolean;
        properties: RecordstringIJsonSchema;
        patternProperties?: undefined | RecordstringIJsonSchema;
        additionalProperties?: undefined | IJsonSchema.IEnumerationboolean | IJsonSchema.IEnumerationnumber | IJsonSchema.IEnumerationstring | IJsonSchema.IBoolean | IJsonSchema.IInteger | IJsonSchema.INumber | IJsonSchema.IString | IJsonSchema.IArray | IJsonSchema.ITuple | IJsonSchema.IOneOf | IJsonSchema.IReference | IJsonSchema.INullOnly | IJsonSchema.IUnknown;
        required?: undefined | Array<string>;
        description?: undefined | string;
        "x-typia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
        "x-typia-patternProperties"?: undefined | RecordstringIJsonSchema;
        "x-typia-additionalProperties"?: undefined | IJsonSchema.IEnumerationboolean | IJsonSchema.IEnumerationnumber | IJsonSchema.IEnumerationstring | IJsonSchema.IBoolean | IJsonSchema.IInteger | IJsonSchema.INumber | IJsonSchema.IString | IJsonSchema.IArray | IJsonSchema.ITuple | IJsonSchema.IOneOf | IJsonSchema.IReference | IJsonSchema.INullOnly | IJsonSchema.IUnknown;
    }
}