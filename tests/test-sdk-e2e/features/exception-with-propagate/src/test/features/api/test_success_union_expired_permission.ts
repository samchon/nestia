import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.success.union;

/**
 * Verifies success.union propagates EXPIRED_PERMISSION with its HTTP status.
 *
 * A propagated error must preserve both the status discriminant and authored
 * body.
 *
 * 1. Send this permission member through the generated route.
 * 2. Require a resolved 401 result with the exact submitted body.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated success.union request with EXPIRED_PERMISSION must resolve to status 401 and exactly that error body, detecting lost error propagation, wrong status or an incompatible decoded body.
 * @evidence contracts/testing.md#independent-expectations The handwritten controller throws UnauthorizedException with the submitted EXPIRED_PERMISSION; its HTTP exception filter exposes that body and the authored TypedException union documents status 401 independently of the generated client.
 * @evidence contracts/testing.md#distinguishing-cases This owns EXPIRED_PERMISSION on success.union; the sibling cases retain the other authored permission union members and the separate fail/composite/success-union routes. It does not assert a successful 2xx branch because these authored handlers always throw.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this matching exported async function in the feature runtime and awaits the generated request against its backend after SDK generation.
 * @evidence contracts/e2e.md#necessary-boundary This connects generated status-discriminated propagation, the fetcher, actual throwing handler and exception filter; a direct metadata or serializer call cannot prove 401 resolves as the supported propagation result rather than an exception.
 * @evidence contracts/e2e.md#shared-execution Every permission case reuses the feature SDK, backend and filter in the shared runtime program, without another installation, compiler or server. Its distinct generator configuration stays with its existing CLI boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The authored input is an immutable literal and the throwing handler/filter retain no case state. Each request is awaited, and the feature entry finally closes its backend after report, discovery or startup failure.
 * @evidence contracts/e2e.md#preserved-coverage The original generated route, exact 401 test and body equality are unchanged. Each former multi-export function now has its own named file/export so failure identity and Evidence ownership remain independently discoverable.
 */
export const test_success_union_expired_permission = async (
  connection: IConnection,
) => {
  const response = await test(connection, "EXPIRED_PERMISSION");
  if (response.status === 401)
    TestValidator.equals("response", response.data, "EXPIRED_PERMISSION");
  else throw Error("unexpected response");
};
