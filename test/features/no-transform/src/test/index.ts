import { NoTransformConfigurationError } from "@nestia/core/lib/decorators/NoTransformConfigurationError";
import { DynamicExecutor } from "@nestia/e2e";

// prettier-ignore
NoTransformConfigurationError.throws = false;

// prettier-ignore
import { Backend } from "../Backend";

async function main(): Promise<void> {
  const server: Backend = new Backend();
  await server.open();

  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    extension: __filename.substring(__filename.length - 2),
    prefix: "test",
    parameters: () => [
      {
        host: "http://127.0.0.1:37000",
        encryption: {
          key: "A".repeat(32),
          iv: "B".repeat(16),
        },
      },
    ],
    location: `${__dirname}/features`,
    onComplete: (exec) => {
      if (exec.error === null) {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      console.log(`  - ${exec.name}: ${elapsed.toLocaleString()} ms`);
      } else
        console.log(`  - ${exec.name}: ${exec.error.name}`);
    },
  });
  await server.close();

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
    process.exit(-1);
  }
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
