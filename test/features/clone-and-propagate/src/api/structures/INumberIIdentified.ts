import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type INumberIIdentified = {
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
    $id?: undefined | string;
    $recursiveAnchor?: undefined | boolean;
}