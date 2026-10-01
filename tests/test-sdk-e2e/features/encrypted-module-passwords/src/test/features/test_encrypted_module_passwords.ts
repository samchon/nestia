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
 * @evidence contracts/testing.md#behavioral-verification Seven generated encrypted echo accessors must return the exact submitted secret under the module or controller-specific key; using the module key against the own-key controller must reject.
 * @evidence contracts/testing.md#independent-expectations PasswordControllers explicitly echo their input. MODULE_PASSWORD and OWN_PASSWORD are distinct authored constants; exact submitted-body equality is independent of a random response generator.
 * @evidence contracts/testing.md#distinguishing-cases Own, dynamic, deferred forwardRef, cyclic and promised module controllers contrast traversal forms; own-key and inherited controllers contrast precedence. The wrong-key control accepts any rejection and does not independently pin its HTTP status.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual module construction, encrypted transport and generated clients connect password assignment to decryptable responses; inspecting module metadata alone cannot prove this chain.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
