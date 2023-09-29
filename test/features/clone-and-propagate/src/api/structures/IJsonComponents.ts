import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";
import type { RecordstringIJsonSchema } from "./RecordstringIJsonSchema";

export namespace IJsonComponents {
    export type IObject = {
        $id?: string;
        type: ("object");
        /**
         * Only when swagger mode.
         */
        nullable?: boolean;
        properties: RecordstringIJsonSchema;
        patternProperties?: RecordstringIJsonSchema;
        additionalProperties?: IJsonSchema;
        required?: Array<string>;
        description?: string;
        "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
        "x-typia-patternProperties"?: RecordstringIJsonSchema;
        "x-typia-additionalProperties"?: IJsonSchema;
    }
}