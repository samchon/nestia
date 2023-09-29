import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type INumberIIdentified = {
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
    $id?: string;
    $recursiveAnchor?: boolean;
}