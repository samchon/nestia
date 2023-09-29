import type { IJsDocTagInfo } from "./IJsDocTagInfo";

export type IEnumerationbooleanIIdentified = {
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
    $id?: string;
    $recursiveAnchor?: boolean;
}