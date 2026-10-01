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
 * @evidence contracts/testing.md#behavioral-verification The keyword props simulator must return declared IShadow/string-array shapes and reject a numeric argument where the route requires string.
 * @evidence contracts/testing.md#independent-expectations Authored response declarations establish the shapes, and explicit numeric1 violates the string parameter independently of random output. No exact random value is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Accepted shadow/member calls contrast an awaited invalid argument; any rejection satisfies the negative, without pinning HTTP status.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_keyword_simulate export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated simulator references and emitted consumer bindings must connect to installed helper validation; testing a name allocator alone cannot detect runtime shadowing.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its generated simulator artifacts with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity simulate:true belongs to a local copied connection and random values are checked only against declared shapes. Awaited rejection belongs to this invocation; the entry closes its backend and copied outputs remain feature-owned.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_keyword_simulate assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
