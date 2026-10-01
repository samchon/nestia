import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies an encrypted `PATCH` body reaches its handler through the SDK and a
 * bodyless success comes back as nothing.
 *
 * 1. Change the password through the encrypted route.
 * 2. Assert the call resolves with no content.
 *
 * @evidence contracts/testing.md#behavioral-verification A generated PATCH request carrying the explicit encrypted old/new password body must resolve with exactly undefined.
 * @evidence contracts/testing.md#independent-expectations The authored password-change handler consumes ISeller.IChangePassword and declares Promise<void>; the bodyless response contract independently establishes undefined. The fixture does not persist password changes.
 * @evidence contracts/testing.md#distinguishing-cases An encrypted request with a bodyless success contrasts encrypted join/login responses. Exact undefined rejects an unexpected decoded object, while password validation/persistence is outside this fixture.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual encrypted body handling and generated bodyless response decoding must connect across HTTP PATCH; a DTO or AES unit cannot certify the empty response.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export async function test_api_seller_password_change(
  connection: api.IConnection,
): Promise<void> {
  const output: void =
    await api.functional.sellers.authenticate.password.change(connection, {
      old_password: "qweqwe123!",
      new_password: "asdasd456@",
    });
  TestValidator.equals("output", output, undefined);
}
