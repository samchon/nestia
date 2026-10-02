import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IPasswordEcho } from "@api/lib/structures/IPasswordEcho";

import { MODULE_PASSWORD } from "../../Backend";
import { OWN_PASSWORD } from "../../controllers/PasswordControllers";

/**
 * Verifies every controller an `EncryptedModule` reaches answers with the
 * module's password, and an `@EncryptedController` keeps its own.
 *
 * The module walked only the imports that were classes, so the controllers of a
 * dynamic module, a `forwardRef()`, and a promised module got no password and
 * failed at request time (#1697). It also overwrote the password an
 * `@EncryptedController` declared, so a client holding that controller's key
 * could not decrypt its responses (#1698).
 *
 * 1. Call each module controller through the SDK with the module's key: the
 *    module's own, a dynamic module's, a forward reference's resolved only
 *    after the decorators ran, one of two modules importing each other, and a
 *    promised dynamic module's.
 * 2. Call the `@EncryptedController` and a subclass of it with the controller's
 *    own key.
 * 3. Assert the module's key cannot talk to the `@EncryptedController`.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks module, dynamic, forwardRef, cyclic, promised and explicitly encrypted controllers round-trip with the proper key.
 * @evidence contracts/testing.md#independent-expectations The authored MODULE_PASSWORD and OWN_PASSWORD assignments establish which connection may decrypt each endpoint.
 * @evidence contracts/testing.md#distinguishing-cases Module traversal variants and explicit/inherited controller keys contrast with a wrong-key request that must reject.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks module, dynamic, forwardRef, cyclic, promised and explicitly encrypted controllers round-trip with the proper key. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Module traversal variants and explicit/inherited controller keys contrast with a wrong-key request that must reject. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_encrypted_module_passwords = async (
  connection: api.IConnection,
): Promise<void> => {
  const module: api.IConnection = {
    host: connection.host,
    encryption: MODULE_PASSWORD,
  };
  const own: api.IConnection = {
    host: connection.host,
    encryption: OWN_PASSWORD,
  };
  const input: IPasswordEcho = { value: "secret" };
  const routes = [
    ["plain", api.functional.plain.echo, module],
    ["dynamic", api.functional.dynamic.echo, module],
    ["forward", api.functional.forward.echo, module],
    ["cyclic", api.functional.cyclic.echo, module],
    ["async", api.functional.async.echo, module],
    ["own", api.functional.own.echo, own],
    ["inherited", api.functional.inherited.echo, own],
  ] as const;
  for (const [title, call, key] of routes)
    TestValidator.equals(title, await call(key, input), input);
  await TestValidator.error("own with the module key", () =>
    api.functional.own.echo(module, input),
  );
};
