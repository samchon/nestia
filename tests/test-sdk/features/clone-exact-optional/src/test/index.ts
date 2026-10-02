import { DynamicExecutor } from "@nestia/e2e";

export async function main(): Promise<void> {
  const report = await DynamicExecutor.validate({
    location: `${__dirname}/features`,
    prefix: "test",
    extension: __filename.slice(-2),
    parameters: () => [{ host: "http://127.0.0.1", simulate: true }],
  });
  if (report.executions.length === 0) throw new Error("No tests discovered.");
  for (const execution of report.executions)
    if (execution.error !== null) throw execution.error;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
