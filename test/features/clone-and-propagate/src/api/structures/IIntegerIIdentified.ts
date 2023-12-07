import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IIntegerIIdentified = {
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
    $id?: undefined | string;
    $recursiveAnchor?: undefined | boolean;
}