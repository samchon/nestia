import { tags } from "typia";

/**
 * JSON Scheme에 `x-secret-key` 를 추가해주는 타입.
 *
 * 아래와 같이 원시 원자 타입들에 대하여 사용 가능하다.
 *
 * - `string & SecretKey<"Some secret">`
 *
 * @author Jake
 * @template Value Secret Key, 어떤 종류의 인증키가 필요한가
 * @template Scopes 필요한 스코프 리스트, 스코프가 필요없으면 빈 배열을 사용한다
 * @reference https://typia.io/docs/json/schema/#customization
 */
export type SecretKey<
  Value extends string,
  Scopes extends never | string[] = never,
> = tags.TagBase<{
  target: "string";
  kind: "SecretKey";
  value: undefined;
  schema: {
    "x-wrtn-secret-key": Value;
    "x-wrtn-secret-scopes": Scopes;
  };
}>;
