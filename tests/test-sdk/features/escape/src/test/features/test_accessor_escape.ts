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
 */
export const test_accessor_escape = (): void => {
  api.functional._delete.erase.METADATA;
  api.functional.users._me.permissions.METADATA;

  if (api.functional.users._me.permissions.path() !== "/users/@me/permissions")
    throw new Error("Escaped SDK accessor must keep the original route path.");
};
