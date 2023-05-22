import "reflect-metadata";

import { BenchmarkServer } from "./internal/BenchmarkServer";
import { BenchmarkReporter } from "./internal/BenchmarktReporter";
import { BenchmarkStream } from "./internal/BenhmarkStream";

async function main(): Promise<void> {
    const stream: BenchmarkStream = await BenchmarkReporter.initialize();
    for (const category of ["assert", "stringify", "performance"])
        await BenchmarkReporter.write(stream)(
            await BenchmarkServer.measure(category),
        );
    await BenchmarkReporter.terminate(stream);
}
main().catch((exp) => {
    console.log(exp);
    process.exit(1);
});
