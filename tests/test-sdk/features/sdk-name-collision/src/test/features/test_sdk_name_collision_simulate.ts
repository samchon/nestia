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
 * @evidence contracts/testing.md#behavioral-verification The positional argument simulator must return declared IShadow/string-array shapes and reject a numeric argument where the route requires string.
 * @evidence contracts/testing.md#independent-expectations Authored response declarations establish the shapes, and explicit numeric1 violates the string parameter independently of random output. No exact random value is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Accepted shadow/member calls plus imports/locals contrast an awaited invalid argument; any rejection satisfies the negative, without pinning HTTP status.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_simulate export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated simulator references and emitted consumer bindings must connect to installed helper validation; testing a name allocator alone cannot detect runtime shadowing.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its generated simulator artifacts with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity simulate:true belongs to a local copied connection and random values are checked only against declared shapes. Awaited rejection belongs to this invocation; the entry closes its backend and copied outputs remain feature-owned.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_simulate assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
