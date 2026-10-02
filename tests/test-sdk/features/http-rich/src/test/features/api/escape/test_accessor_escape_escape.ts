import api from "@api";

/**
 * Verifies SDK accessors escape reserved words and non-identifier route
 * segments without changing endpoint URLs.
 *
 * Locks the accessor normalization branch shared by the SDK file tree and
 * namespace exports. Reserved route names already need a leading underscore;
 * route segments such as `@me` additionally need illegal identifier characters
 * converted before TypeScript export declarations are printed.
 *
 * 1. Touch the generated accessor for the reserved `delete` route segment.
 * 2. Touch the generated accessor for the `@me` route segment.
 * 3. Assert the escaped accessor still returns the original endpoint path.
 *
 * @evidence contracts/testing.md#behavioral-verification The emitted accessor must remain reachable for reserved delete and non-identifier @me segments; its path function must preserve the authored endpoint URL including the scenario prefix.
 * @evidence contracts/testing.md#independent-expectations The authored Controller and TypedRoute path literals establish the expected URL, while TypeScript identifier rules require escaped export accessors.
 * @evidence contracts/testing.md#distinguishing-cases The reserved-word and illegal-character accessors are separate controls, with an explicit path equality assertion for @me rather than mere import success.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, SDK file writer and imported generated accessor must agree on executable export and URL spelling. Owning normalization units alone do not establish this emitted-consumer connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from escape/src/test/features/test_accessor_escape.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_accessor_escape_escape = (): void => {
  api.functional.http_rich.escape._delete.erase.METADATA;
  api.functional.http_rich.escape.users._me.permissions.METADATA;

  if (
    api.functional.http_rich.escape.users._me.permissions.path() !==
    "/http_rich/escape/users/@me/permissions"
  )
    throw new Error("Escaped SDK accessor must keep the original route path.");
};
