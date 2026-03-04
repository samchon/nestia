import type { tags } from "typia";

/**
 * Make all properties in T optional
 */
export type PartialPickIUsernameemailoptional_attrnullable_attr = {
  name?: undefined | string;
  email?: null | undefined | (string & tags.Format<"email">);
  optional_attr?: undefined | string;
  nullable_attr?: null | undefined | string;
};
