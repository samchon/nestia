import { DynamicExecutor } from "@nestia/e2e";

import { Backend } from "../Backend";

/**
 * Runs the mcp-enhancers generated-consumer and live MCP cases against one
 * backend.
 *
 * Discovery failures must still release the shared backend and a zero-case
 * discovery must not become a successful feature.
 *
 * 1. Open the authored feature backend and discover matching test exports.
 * 2. Run all discovered cases, close the backend and report their original errors.
 *
 * @evidence contracts/testing.md#behavioral-verification DynamicExecutor.validate executes this fixture's test exports; their assertions own the protocol, wrapper and metadata results, and this entry rejects empty discovery or any reported error.
 * @evidence contracts/testing.md#independent-expectations Expected results live in the authored cases, not an aggregate snapshot; the entry requires at least one discovered case and no errors.
 * @evidence contracts/testing.md#distinguishing-cases Handles populated successful discovery, failed case reports and zero discoveries; finally closes the backend after startup or execution failures.
 * @evidence contracts/testing.md#execution-ownership tests/test-sdk/start.js prepares this feature and calls this exported main; DynamicExecutor discovers test-prefixed functions under the feature directory as integration cases.
 * @evidence contracts/e2e.md#necessary-boundary The feature connects produced controller and SDK artifacts to a live MCP transport; case-level declarations describe the unique dispatch, protocol or generated-wrapper distinction.
 * @evidence contracts/e2e.md#shared-execution One backend serves all cases in this fixture and consumes one prepared feature program; other SDK feature fixtures retain independent preparation and backend lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The harness supplies a feature-specific port and these controllers derive outputs from request arguments. This entry owns backend cleanup through finally, while protocol cases own their client connections.
 * @evidence contracts/e2e.md#preserved-coverage Existing individual case assertions and error reports remain discoverable; adding a zero-discovery guard and failure cleanup does not replace them with compilation success.
 */
export async function main(): Promise<void> {
  const server: Backend = new Backend();
  let report: DynamicExecutor.IReport;
  try {
    await server.open();

    report = await DynamicExecutor.validate({
      extension: __filename.substring(__filename.length - 2),
      prefix: "test",
      parameters: () => [
        {
          host: `http://127.0.0.1:${process.env.TEST_SDK_PORT ?? 37_000}`,
          path: "/mcp",
        },
      ],
      location: `${__dirname}/features`,
      onComplete: (exec) => {
        const elapsed: number =
          new Date(exec.completed_at).getTime() -
          new Date(exec.started_at).getTime();
        console.log(`  - ${exec.name}: ${elapsed.toLocaleString()} ms`);
      },
    });
  } finally {
    await server.close();
  }
  if (report.executions.length === 0)
    throw new Error("No MCP test function has been discovered.");

  const exceptions: Error[] = report.executions
    .filter((exec) => exec.error !== null)
    .map((exec) => exec.error!);
  if (exceptions.length === 0) {
    console.log("Success");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
  } else {
    for (const exp of exceptions) console.log(exp);
    console.log("Failed");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
    throw new Error("Failed");
  }
}
if (require.main === module)
  main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
  });
