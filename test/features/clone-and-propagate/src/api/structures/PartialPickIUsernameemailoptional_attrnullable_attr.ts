import type { Format } from "typia/lib/tags/Format";

/**
 * Make all properties in T optional
 */
export type PartialPickIUsernameemailoptional_attrnullable_attr =
  /**
   * Make all properties in T optional
   */
  {
    name?: undefined | string;
    email?: null | undefined | (string & Format<"email">);
    optional_attr?: undefined | string;
    nullable_attr?: null | undefined | string;
  };
