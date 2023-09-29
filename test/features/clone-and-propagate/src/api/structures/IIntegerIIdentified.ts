import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IMetadataTypeTag } from "./IMetadataTypeTag";

export type IIntegerIIdentified = {
    minimum?: (number & Type<"int32">);
    maximum?: (number & Type<"int32">);
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
    multipleOf?: (number & Type<"int32">);
    "x-typia-typeTags"?: Array<IMetadataTypeTag>;
    "default"?: number;
    type: ("integer");
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