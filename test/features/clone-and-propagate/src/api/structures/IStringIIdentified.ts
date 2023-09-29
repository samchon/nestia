import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IStringIIdentified = {
    minLength?: (number & Type<"uint32">);
    maxLength?: (number & Type<"uint32">);
    pattern?: string;
    format?: string;
    "x-typia-typeTags"?: Array<IMetadataTypeTag>;
    "default"?: string;
    type: ("string");
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