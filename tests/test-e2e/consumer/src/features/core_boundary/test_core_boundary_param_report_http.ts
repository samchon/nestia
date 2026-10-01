import { HttpError } from "@nestia/fetcher";
import assert from "node:assert/strict";
import typia, { IValidation } from "typia";

import api from "../../api";

/**
 * Verifies parameter report flags preserve distinct generated-client JSON
 * errors.
 *
 * The global native option flag is a pure selection assertion; the public
 * manual third argument separately connects that supported ABI to actual HTTP
 * reporting without a second producer configuration.
 *
 * 1. Accept numeric input on both flag siblings.
 * 2. Reject two and inspect the generated error message JSON for each exact shape.
 * 3. Repeat valid input after rejection to observe recovery.
 *
 * @evidence contracts/testing.md#behavioral-verification True reporting produces exactly message plus an IValidation.IError array; false reporting produces message/path/expected/value/reason without errors, both with400.
 * @evidence contracts/testing.md#independent-expectations The original param-validate case specifies message plus IValidation.IError array. TypedParam's public third flag specifies the contrasting default reason form; literal numeric input supplies the accepted result.
 * @evidence contracts/testing.md#distinguishing-cases Both flags run valid/rejected/recovery inputs using the same public numeric decoder, with exact key checks excluding an accidentally shared error shape.
 * @evidence contracts/testing.md#execution-ownership The sole generated consumer discovers this matching named export and awaits it against each shared adapter connection. Private error helpers remain reviewed within this operation.
 * @evidence contracts/e2e.md#necessary-boundary Installed decoder/TypedParam runtime, Nest JSON wrapping and generated HttpError.message must connect; source-emitted flags alone cannot prove this transport.
 * @evidence contracts/e2e.md#shared-execution All requests reuse the single packed installation, rich producer, generated consumer and sequential Express/Fastify applications; this case adds no compiler, generator, backend or client process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Only submitted numeric text and fresh response objects vary; no global transform option or validation guard changes. Every response is consumed by the generated client.
 * @evidence contracts/e2e.md#preserved-coverage Original param-validate parseable exact report shape remains here. Ten-mode Go routing units retain global option to emitted TypedParam flag selection. These distinct witnesses do not claim a global validate-configured producer was executed here.
 */
export const test_core_boundary_param_report_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const routes = api.functional.core_boundary.param_report;
  for (const [name, call] of [
    ["flat", routes.flat],
    ["structured", routes.structured],
  ] as const) {
    assert.equal(await call(connection, 12.5), 12.5);
    const error: unknown = await call(connection, "two" as never).then(
      () => null,
      (caught: unknown) => caught,
    );
    assert.ok(
      error instanceof HttpError,
      "invalid parameter must reject through generated client",
    );
    assert.equal(error.status, 400);
    const parsed: unknown = JSON.parse(error.message);
    if (name === "structured") {
      const report = typia.assertEquals<{
        message: string;
        errors: IValidation.IError[];
      }>(parsed);
      assert.equal(report.message, 'Invalid URL parameter value on "value".');
      assert.equal(report.errors.length, 1);
      assert.equal(typeof report.errors[0].path, "string");
      assert.equal(typeof report.errors[0].expected, "string");
    } else {
      const report = typia.assertEquals<{
        message: string;
        path: string;
        expected: string;
        value: unknown;
        reason: string;
      }>(parsed);
      assert.equal(report.message, 'Invalid URL parameter value on "value".');
      assert.ok(report.reason.length > 0);
    }
    assert.equal(await call(connection, 7), 7);
  }
};
