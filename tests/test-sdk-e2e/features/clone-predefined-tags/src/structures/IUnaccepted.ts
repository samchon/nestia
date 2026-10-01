import { tags } from "typia";

/**
 * A user's own tag expanding like `tags.Default<[[1]]>`, which `tags.Default`
 * does not accept: its tuple holds only atomic values.
 */
export type NestedDefault = tags.TagBase<{
  target: "array";
  kind: "default";
  value: [[1]];
  exclusive: true;
  schema: { default: [[1]] };
}>;

/**
 * A user's own tag expanding like `tags.Examples<["x"]>`, which `tags.Examples`
 * does not accept: it takes a record, not an array.
 */
export type ListedExamples = tags.TagBase<{
  target: "string";
  kind: "examples";
  value: ["x"];
  exclusive: true;
  schema: { examples: ["x"] };
}>;

/**
 * A user's own tag expanding like `tags.Format<"phone">`, which `tags.Format`
 * does not accept: `phone` is no typia format.
 */
export type PhoneFormat = tags.TagBase<{
  target: "string";
  kind: "format";
  value: "phone";
  validate: `$importInternal("isFormatPhone")($input)`;
  exclusive: ["format", "pattern"];
  schema: { format: "phone" };
}>;

/**
 * Custom tags each expanding like a predefined tag given an argument that
 * predefined tag does not accept.
 */
export interface IUnaccepted {
  nested: number[][] & NestedDefault;
  listed: string & ListedExamples;
  phone: string & PhoneFormat;
}
