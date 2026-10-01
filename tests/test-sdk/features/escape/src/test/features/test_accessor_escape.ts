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
 * @evidence contracts/testing.md#behavioral-verification Generated reserved delete and illegal @me accessor paths must exist, and users._me.permissions.path must return exactly /users/@me/permissions.
 * @evidence contracts/testing.md#independent-expectations The authored route segments require legal TypeScript accessors while retaining original endpoint spelling. The expected path is a handwritten route literal, not a generated snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Reserved-word and non-identifier segments contrast two normalization branches. Touching METADATA only checks availability; this case does not send HTTP or assert every metadata property.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Real generated modules must compile/import and expose a path builder preserving URL spelling. This is a generated-consumer boundary, not a transport test.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_accessor_escape = (): void => {
  api.functional._delete.erase.METADATA;
  api.functional.users._me.permissions.METADATA;

  if (api.functional.users._me.permissions.path() !== "/users/@me/permissions")
    throw new Error("Escaped SDK accessor must keep the original route path.");
};
