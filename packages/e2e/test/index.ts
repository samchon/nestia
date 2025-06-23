import { DynamicExecutor } from "@nestia/e2e";

async function main(): Promise<void> {
  const report: DynamicExecutor.IReport = await DynamicExecutor.assert({
    parameters: () => [],
    location: __dirname + "/features",
    prefix: "test",
    onComplete: (exec) => {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      console.log(` - ${exec.context.executed}/${exec.context.total} ${exec.name}: ${elapsed.toLocaleString()} ms`);
    },
    simultaneous: 1,
  });
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
