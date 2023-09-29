import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";

export type IOneOfIIdentified = {
    oneOf: Array<IJsonSchema>;
    deprecated?: boolean;
    title?: string;
    description?: string;
    "x-typia-jsDocTags"?: Array<IJsDocTagInfo>;
    "x-typia-required"?: boolean;
    "x-typia-optional"?: boolean;
    "x-typia-rest"?: boolean;
    $id?: string;
    $recursiveAnchor?: boolean;
}