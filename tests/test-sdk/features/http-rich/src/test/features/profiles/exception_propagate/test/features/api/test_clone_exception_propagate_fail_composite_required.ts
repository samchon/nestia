import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "../../../api";

const test =
  api.functional.http_rich.options.exception_propagate.fail.composite;

/**
 * Verifies fail_composite propagates REQUIRED_PERMISSION with status 401.
 *
 * Propagation retains the authored error status and payload as a typed result
 * instead of converting the declared failure into an exception.
 *
 * 1. Call the generated permission endpoint with its authored scenario.
 * 2. Require status 401 and the exact REQUIRED_PERMISSION payload.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated propagation call retains status 401 and the original exact permission string; another status throws.
 * @evidence contracts/testing.md#independent-expectations The authored controller throws UnauthorizedException with the literal permission string; the expectation is independent of generated output.
 * @evidence contracts/testing.md#distinguishing-cases This case owns its original permission literal and scalar or union endpoint; the eight preserved cases distinguish every original endpoint and declared union member.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered in the shared installed consumer profile and calls its generated SDK over actual HTTP.
 * @evidence contracts/e2e.md#necessary-boundary Native generation, cloned propagation types, HTTP exception filtering and generated response decoding must agree on the real 401 payload.
 * @evidence contracts/e2e.md#shared-execution All eight cases share one installation, producer, consumer and listener; their option profile generates once without a separate server or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique controller, filter, type and route identities isolate this graph; its handlers are stateless and always throw the authored permission value.
 * @evidence contracts/e2e.md#preserved-coverage The complete original invocation, literal payload, status branch and unexpected-status failure remain; only imports, route accessor and discovered name change.
 */
export const test_clone_exception_propagate_fail_composite_required = async (
  connection: IConnection,
) => {
  const response = await test(connection, "REQUIRED_PERMISSION");
  if (response.status === 401)
    TestValidator.equals("response", response.data, "REQUIRED_PERMISSION");
  else throw Error("unexpected response");
};
