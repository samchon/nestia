import { DynamicExecutor } from "../DynamicExecutor";

async function main(): Promise<void> {
    const report: DynamicExecutor.IReport = await DynamicExecutor.assert({
        prefix: "test",
        parameters: () => [],
    })(__dirname + "/features");
    console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
