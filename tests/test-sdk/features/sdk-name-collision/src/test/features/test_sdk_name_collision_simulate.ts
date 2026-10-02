import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IShadow } from "@api/lib/structures/IShadow";

/**
 * Verifies the mockup simulator of routes with colliding parameter names runs.
 *
 * `simulate()` shares the SDK function's parameter names and adds its own
 * references: `path()`, `random()`, `METADATA`, `NestiaSimulator`, and a local
 * `assert`. A parameter named after one of them shadowed it (#1647), so the
 * simulator must take its arguments under the same names the SDK function
 * passes and still validate them.
 *
 * 1. Call routes whose parameters are named after those references with `simulate:
 *    true`.
 * 2. Assert each returns a random value of the declared type.
 * 3. Assert an invalid argument is still rejected by the simulator.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that simulations return IShadow/string arrays and reject one numeric argument.
 * @evidence contracts/testing.md#independent-expectations Expectations come from declared output and argument types, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns four colliding positional routes and an adjacent wrong-type argument.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Compiled generated simulation binds arguments to validators and random outputs without contacting the backend.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted four colliding positional routes and an adjacent wrong-type argument distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_name_collision_simulate = async (
  connection: api.IConnection,
): Promise<void> => {
  const simulated: api.IConnection = { ...connection, simulate: true };
  const shadows = api.functional.shadow;
  typia.assert<IShadow>(await shadows.query(simulated, { value: "shadow" }));
  typia.assert<string[]>(await shadows.members(simulated, "p", "r", "m", "s"));
  typia.assert<string[]>(await shadows.imports(simulated, "a", "b", "c"));
  typia.assert<string[]>(
    await shadows.locals(simulated, "k", "v", "l", "a", "e"),
  );
  await TestValidator.error("invalid argument", () =>
    shadows.members(simulated, "p", "r", "m", 1 as any),
  );
};
