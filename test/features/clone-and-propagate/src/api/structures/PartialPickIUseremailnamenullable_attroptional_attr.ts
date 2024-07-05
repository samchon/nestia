import type { Format } from "typia/lib/tags/Format";

/**
 * Make all properties in T optional
 */
export type PartialPickIUseremailnamenullable_attroptional_attr =
  /**
   * Make all properties in T optional
   */
  {
    email?: null | undefined | (string & Format<"email">);
    name?: undefined | string;
    nullable_attr?: null | undefined | string;
    optional_attr?: undefined | string;
  };
