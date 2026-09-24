import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IPasswordEcho } from "@api/lib/structures/IPasswordEcho";

import { MODULE_PASSWORD } from "../../Backend";
import { OWN_PASSWORD } from "../../controllers/PasswordControllers";

/**
 * Verifies every controller an `EncryptedModule` reaches answers with the
 * module's password, and an `@EncryptedController` keeps its own.
 *
 * The module walked only the imports that were classes, so the controllers of
 * a dynamic module, a `forwardRef()`, and a promised module got no password and
 * failed at request time (#1697). It also overwrote the password an
 * `@EncryptedController` declared, so a client holding that controller's key
 * could not decrypt its responses (#1698).
 *
 * 1. Call each module controller through the SDK with the module's key: the
 *    module's own, a dynamic module's, a forward reference's resolved only after
 *    the decorators ran, one of two modules importing each other, and a
 *    promised dynamic module's.
 * 2. Call the `@EncryptedController` and a subclass of it with the controller's
 *    own key.
 * 3. Assert the module's key cannot talk to the `@EncryptedController`.
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
