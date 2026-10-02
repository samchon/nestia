import { DynamicExecutor } from "@nestia/e2e";

import { Backend } from "../Backend";

/**
 * Runs body validation, generic DTOs, explicit validators and optional payloads
 * against one generated SDK and one shared application.
 *
 * Each scenario owns a distinct route prefix and its original authored DTOs.
 * The executor retains individual assertion failures and the application is
 * closed even if discovery or a request fails.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor discovers authored and generated request cases in one consumer program, awaits their outcomes and rejects any failed execution. Distinct scenario routes preserve the controller each request exercises.
 * @evidence contracts/common.md#clear-and-simple-design One entry opens one backend, discovers all cases and reports errors after closing it; no old fixture entry or per-scenario server is invoked.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry calls the public executor and ordinary backend methods and supplies only the transport connection. It does not replace generated clients, validation or resolver operations.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the combined scenarios, route separation, retained failure identities and backend lifetime.
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
          encryption: {
            key: "A".repeat(32),
            iv: "B".repeat(16),
          },
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
    throw new Error("No body integration cases have been discovered.");

  console.log("Executed tests", report.executions.length);

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
// ttsx loads the entry through its bootstrap, which remains require.main.
if (require.main === module || process.argv[1] === __filename)
  main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
  });
