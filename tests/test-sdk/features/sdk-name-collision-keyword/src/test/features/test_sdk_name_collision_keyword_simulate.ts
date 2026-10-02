import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IShadow } from "@api/lib/structures/IShadow";

/**
 * Verifies the keyword-mode mockup simulator of routes with colliding names
 * runs.
 *
 * The simulator reads each argument from its own `props` parameter, which
 * yields to a method named `props` like the SDK function's does (#1647).
 *
 * 1. Call colliding routes with `simulate: true`.
 * 2. Assert each returns a random value of the declared type, and that an invalid
 *    argument is still rejected.
 */
export const test_sdk_name_collision_keyword_simulate = async (
  connection: api.IConnection,
): Promise<void> => {
  const simulated: api.IConnection = { ...connection, simulate: true };
  const shadows = api.functional.shadow;
  typia.assert<IShadow>(
    await shadows.props(simulated, { props: { value: "shadow" } }),
  );
  typia.assert<string[]>(
    await shadows.members(simulated, {
      path: "p",
      random: "r",
      METADATA: "m",
      assert: "s",
    }),
  );
  await TestValidator.error("invalid argument", () =>
    shadows.members(simulated, {
      path: "p",
      random: "r",
      METADATA: "m",
      assert: 1 as any,
    }),
  );
};
