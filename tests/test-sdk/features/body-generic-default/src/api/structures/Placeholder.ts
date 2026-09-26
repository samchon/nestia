import { tags } from "typia";

/**
 * JSON Schema에 `x-wrtn-placeholder` 를 추가해주는 타입.
 *
 * 아래와 같이 원시 원자 타입들에 대하여 사용 가능하다.
 *
 * - `boolean & Placeholder<"Some placeholder text">`
 * - `number & Placeholder<"Some placeholder text">`
 * - `string & Placeholder<"Some placeholder text">`
 *
 * @author Samchon
 * @reference https://typia.io/docs/json/schema/#customization
 */
export type Placeholder<Value extends string> = tags.TagBase<{
  target: "boolean" | "number" | "string";
  kind: "placeholder";
  value: Value;
  schema: {
    "x-wrtn-placeholder": Value;
  };
}>;
