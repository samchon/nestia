import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";

import { TestGlobal } from "./TestGlobal";
import { ArgumentParser } from "./utils/ArgumentParser";

interface IOptions {
  simulate: boolean;
  include?: string[];
  exclude?: string[];
  trace: boolean;
}

const getOptions = () =>
  ArgumentParser.parse<IOptions>(async (command, prompt, action) => {
    command.option("--simulate <boolean>", "Mockup Simultator");
    command.option("--include <string...>", "include feature files");
    command.option("--exclude <string...>", "exclude feature files");
    command.option("--trace <boolean>", "trace detailed errors");

    return action(async (options) => {
      if (typeof options.simulate === "string")
        options.simulate = options.simulate === "true";
      options.simulate ??= await prompt.boolean("simulate")("Mockup Simulator");
      options.trace = options.trace !== ("false" as any);
      return options as IOptions;
    });
  });

const main = async (): Promise<void> => {
  // DO TEST
  const options: IOptions = await getOptions();
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test",
    location: __dirname + "/features",
    extension: __filename.substring(__filename.length - 2),
    parameters: () => [
      {
        ...TestGlobal.connection(),
        simulate: options.simulate,
      },
    ],
    filter: (func) =>
      (!options.include?.length ||
        (options.include ?? []).some((str) => func.includes(str))) &&
      (!options.exclude?.length ||
        (options.exclude ?? []).every((str) => !func.includes(str))),
    onComplete: (exec) => {
      const trace = (str: string) =>
        console.log(`  - ${chalk.green(exec.name)}: ${str}`);
      if (exec.error === null) {
        const elapsed: number =
          new Date(exec.completed_at).getTime() -
          new Date(exec.started_at).getTime();
        trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
      } else trace(chalk.red(exec.error.name));
    },
  });

  // REPORT EXCEPTIONS
  const exceptions: Error[] = report.executions
    .filter((exec) => exec.error !== null)
    .map((exec) => exec.error!);
  if (exceptions.length === 0) {
    console.log("Success");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
  } else {
    if (options.trace !== false) for (const exp of exceptions) console.log(exp);
    console.log("Failed");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
  }

  // TERMINATE
  if (exceptions.length) process.exit(-1);
  else process.exit(0);
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
