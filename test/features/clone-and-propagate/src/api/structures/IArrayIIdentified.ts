import type { Type } from "typia/lib/tags/Type";

import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";

export type IArrayIIdentified = {
    items: IJsonSchema;
    minItems?: (number & Type<"uint32">);
    maxItems?: (number & Type<"uint32">);
    "x-typia-tuple"?: IJsonSchema.ITuple;
    type: ("array");
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