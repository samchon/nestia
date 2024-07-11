import { DynamicExecutor } from "@nestia/e2e";
import { IMigrateDocument, OpenApi } from "@samchon/openapi";
import fs from "fs";

import { Backend } from "../Backend";
import { ITestProps } from "./ITestProps";

async function main(): Promise<void> {
  const server: Backend = new Backend();
  await server.open();

  const document: OpenApi.IDocument = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../swagger.json`, "utf8"),
  );
  const migrate: IMigrateDocument = OpenApi.migrate(document);
  await fs.promises.writeFile(
    `${__dirname}/../../migrate.json`,
    JSON.stringify(migrate, null, 2),
    `utf8`,
  );

  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    extension: __filename.substring(__filename.length - 2),
    prefix: "test",
    parameters: () => [
      {
        route: (method, path) => {
          const route = migrate.routes.find(
            (route) => route.method === method && route.path === path,
          );
          if (route === undefined)
            throw new Error(`Route not found: ${method} ${path}`);
          return route;
        },
        connection: {
          host: "http://127.0.0.1:37000",
          encryption: {
            key: "A".repeat(32),
            iv: "B".repeat(16),
          },
        },
      } satisfies ITestProps,
    ],
    location: `${__dirname}/features`,
    onComplete: (exec) => {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      console.log(`  - ${exec.name}: ${elapsed.toLocaleString()} ms`);
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
