import type { IJsDocTagInfo } from "./IJsDocTagInfo";

export type IEnumerationstringIIdentified = {
  enum: string[];
  type: "string";
  default?: undefined | string;
  /**
   * Only when swagger mode.
   */
  nullable?: undefined | boolean;
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
