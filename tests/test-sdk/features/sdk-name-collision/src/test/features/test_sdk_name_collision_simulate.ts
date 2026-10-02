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
