import { DynamicExecutor } from "@nestia/e2e";

/**
 * Verifies the combined generated SDK over the common transport session.
 *
 * Each discovered case retains its own authored oracle and error identity;
 * failures do not stop unrelated request cases from executing.
 *
 * 1. Discover the named request cases in the compiled consumer.
 * 2. Supply the one application's connection and await every case.
 * 3. Reject empty discovery or the aggregate of failed case names.
 *
 * @evidence contracts/testing.md#behavioral-verification DynamicExecutor awaits the retained generated client and raw protocol assertions and rejects their aggregate failures; this entry never accepts a successful compile as a successful request.
 * @evidence contracts/testing.md#independent-expectations Individual cases keep handwritten input values, DTO constraints, arithmetic results and exact error statuses. The entry adds only the independent nonempty execution requirement.
 * @evidence contracts/testing.md#distinguishing-cases Valid, malformed, nullable, repeated-query, multipart, plain-text, WebSocket and MCP cases retain separate failure names. Per-rule compiler decisions belong to direct native units.
 * @evidence contracts/testing.md#execution-ownership The installed consumer entry calls this exported operation after its single compilation. DynamicExecutor discovers one named test per file recursively and awaits its promise.
 * @evidence contracts/e2e.md#necessary-boundary Generated client imports and transported requests must connect to emitted controllers and installed runtime helpers. Direct writer and transform units cannot detect an incorrect actual wire request.
 * @evidence contracts/e2e.md#shared-execution All cases use one installation, producer compilation, generated consumer compilation and backend; this operation launches no compiler or server.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Explicit scenario route and DTO namespaces prevent accidental cross-scenario dispatch. Each case owns request specimens and closes protocol connectors; the start entry closes the backend after this report settles.
 * @evidence contracts/e2e.md#preserved-coverage The request assertions are mapped individually in the campaign transfer ledger. This entry does not claim coverage of untransferred legacy cases or rule-only assertions.
 */
export const main = async (host: string): Promise<void> => {
  const report = await DynamicExecutor.validate({
    location: __dirname + "/features",
    extension: "js",
    prefix: "test",
    parameters: () => [
      {
        host,
        path: "/mcp",
        encryption: { key: "A".repeat(32), iv: "B".repeat(16) },
      },
    ],
    simultaneous: 1,
    onComplete: (execution) => {
      console.log(
        ` - ${execution.name}: ${execution.error === null ? "passed" : "failed"}`,
      );
      if (execution.error !== null) console.error(execution.error);
    },
  });
  if (report.executions.length === 0)
    throw new Error("The rich consumer discovered no request cases.");
  const failures = report.executions.filter(
    (execution) => execution.error !== null,
  );
  if (failures.length)
    throw new Error(
      `Rich consumer failed: ${failures.map((execution) => execution.name).join(", ")}`,
    );
};
