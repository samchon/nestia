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
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that keyword simulations return IShadow/string arrays and reject a numeric assert prop.
 * @evidence contracts/testing.md#independent-expectations Expectations come from declared DTO and props types, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns two colliding-key valid calls and a wrong-type property twin.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Compiled generated simulation binds arguments to validators and random outputs without contacting the backend.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted two colliding-key valid calls and a wrong-type property twin distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
