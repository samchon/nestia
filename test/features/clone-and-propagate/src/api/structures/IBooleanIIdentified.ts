import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IBooleanIIdentified = {
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
    $id?: string;
    $recursiveAnchor?: boolean;
}