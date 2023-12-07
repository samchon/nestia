import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IBooleanIIdentified = {
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
    $id?: undefined | string;
    $recursiveAnchor?: undefined | boolean;
}