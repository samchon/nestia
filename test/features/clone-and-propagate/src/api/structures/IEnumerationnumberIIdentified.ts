import type { IJsDocTagInfo } from "./IJsDocTagInfo";

export type IEnumerationnumberIIdentified = {
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
    $id?: string;
    $recursiveAnchor?: boolean;
}