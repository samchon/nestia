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
 * @evidence contracts/testing.md#behavioral-verification Resolves escaped generated accessors and checks the @me URL remains /users/@me/permissions.
 * @evidence contracts/testing.md#independent-expectations The authored route contains @me; TypeScript identifier escaping must not change the HTTP path.
 * @evidence contracts/testing.md#distinguishing-cases Reserved delete and illegal @me identifier cases remain compile/import controls plus a runtime path assertion.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Resolves escaped generated accessors and checks the @me URL remains /users/@me/permissions. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Reserved delete and illegal @me identifier cases remain compile/import controls plus a runtime path assertion. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_accessor_escape = (): void => {
  api.functional._delete.erase.METADATA;
  api.functional.users._me.permissions.METADATA;

  if (api.functional.users._me.permissions.path() !== "/users/@me/permissions")
    throw new Error("Escaped SDK accessor must keep the original route path.");
};
