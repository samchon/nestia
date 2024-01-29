import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";

export type IOneOfIIdentified = {
  oneOf: IJsonSchema[];
  deprecated?: undefined | boolean;
  title?: undefined | string;
  description?: undefined | string;
  "x-typia-jsDocTags"?: undefined | IJsDocTagInfo[];
  "x-typia-required"?: undefined | boolean;
  "x-typia-optional"?: undefined | boolean;
  "x-typia-rest"?: undefined | boolean;
  $id?: undefined | string;
  $recursiveAnchor?: undefined | boolean;
};
