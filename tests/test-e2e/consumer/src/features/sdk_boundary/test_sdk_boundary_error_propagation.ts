import type { IPropagation } from "@nestia/fetcher";
import assert from "node:assert/strict";

import api from "../../api_propagate";

/**
 * Verifies generated range and permission requests retain propagated status and
 * data.
 *
 * A resolved propagation result must retain the authored exception
 * discriminant, rather than throw or report a successful number. Range type
 * controls retain the independent inclusive HTTP bounds.
 *
 * 1. Compile five literal StatusRange membership controls and request the4XX
 *    route.
 * 2. Request all eight original permission route/member specimens and require401
 *    with the exact authored literal body.
 *
 * @evidence contracts/testing.md#behavioral-verification Five typed true values require400/499 in4XX,500 outside4XX and200/299 in2XX. Generated range resolves success:false/status404/message missing; all eight generated permission requests resolve success:false/status401 with their exact body.
 * @evidence contracts/testing.md#independent-expectations Decimal HTTP status families prescribe the five type verdicts. The original range handler throws NotFoundException(missing), and permission handlers plus their filter prescribe401 and exact permission literals.
 * @evidence contracts/testing.md#distinguishing-cases Inclusive lower/upper range bounds contrast adjacent500. Range message objects differ from literal permission bodies, and all success/get,success/union,fail/get and fail/composite members remain.
 * @evidence contracts/testing.md#execution-ownership One matching exported function is discovered and awaited by the common consumer. Its type controls fail the same consumer compilation; each request failure retains a named cause while remaining requests continue.
 * @evidence contracts/e2e.md#necessary-boundary Actual native range/permission metadata, generated quoted range-key syntax, installed fetcher and original exception filtering must connect. Direct status type calculations do not establish resolved HTTP propagation.
 * @evidence contracts/e2e.md#shared-execution The alternate propagate:true SDK reuses the same producer metadata, application, installation and single consumer compilation. These cases create no compiler or backend; five portable type controls use that existing language preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Boundary-prefixed stateless handlers and local immutable permission inputs isolate requests. Each request is awaited and the common owner closes the shared backend after consumers settle.
 * @evidence contracts/e2e.md#preserved-coverage The original range success/status/message and five compile bounds plus all eight permission status/body controls retain generated request destinations. Raw nonpropagating checks remain complementary; execution is pending the shared gate.
 */
export const test_sdk_boundary_error_propagation = async (
  connection: api.IConnection,
): Promise<void> => {
  const bounds: [
    400 extends IPropagation.StatusRange<"4XX"> ? true : false,
    499 extends IPropagation.StatusRange<"4XX"> ? true : false,
    500 extends IPropagation.StatusRange<"4XX"> ? false : true,
    200 extends IPropagation.StatusRange<"2XX"> ? true : false,
    299 extends IPropagation.StatusRange<"2XX"> ? true : false,
  ] = [true, true, true, true, true];
  assert.deepEqual(bounds, [true, true, true, true, true]);
  const failures: Error[] = [];
  try {
    const output = await api.functional.sdk_boundary.range.get(connection);
    assert.equal(output.success, false);
    assert.equal(output.status, 404);
    assert.equal((output.data as { message: string }).message, "missing");
  } catch (error) {
    failures.push(new Error("propagated range404", { cause: error }));
  }
  const permission = api.functional.sdk_boundary.permission;
  const specimens: Array<
    [
      string,
      () => Promise<{ success: boolean; status: number; data: unknown }>,
      string,
    ]
  > = [
    [
      "success.get",
      () => permission.success.get(connection),
      "INVALID_PERMISSION",
    ],
    [
      "success.union required",
      () => permission.success.union(connection, "REQUIRED_PERMISSION"),
      "REQUIRED_PERMISSION",
    ],
    [
      "success.union expired",
      () => permission.success.union(connection, "EXPIRED_PERMISSION"),
      "EXPIRED_PERMISSION",
    ],
    [
      "fail.get invalid",
      () => permission.fail.get(connection, "INVALID_PERMISSION"),
      "INVALID_PERMISSION",
    ],
    [
      "fail.get expired",
      () => permission.fail.get(connection, "EXPIRED_PERMISSION"),
      "EXPIRED_PERMISSION",
    ],
    [
      "fail.composite required",
      () => permission.fail.composite(connection, "REQUIRED_PERMISSION"),
      "REQUIRED_PERMISSION",
    ],
    [
      "fail.composite invalid",
      () => permission.fail.composite(connection, "INVALID_PERMISSION"),
      "INVALID_PERMISSION",
    ],
    [
      "fail.composite expired",
      () => permission.fail.composite(connection, "EXPIRED_PERMISSION"),
      "EXPIRED_PERMISSION",
    ],
  ];
  for (const [name, request, expected] of specimens) {
    try {
      const output = await request();
      assert.equal(output.success, false, name);
      assert.equal(output.status, 401, name);
      assert.equal(output.data, expected, name);
    } catch (error) {
      failures.push(new Error(name, { cause: error }));
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "SDK boundary generated propagation");
};
