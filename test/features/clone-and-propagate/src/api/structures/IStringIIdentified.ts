import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IStringIIdentified = {
    minLength?: undefined | (number & Type<"uint32">);
    maxLength?: undefined | (number & Type<"uint32">);
    pattern?: undefined | string;
    format?: undefined | string;
    "x-typia-typeTags"?: undefined | Array<IMetadataTypeTag>;
    "default"?: undefined | string;
    type: ("string");
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