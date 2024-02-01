import commander from "commander";
import inquirer from "inquirer";

export namespace MigrateInquirer {
  export interface IOutput {
    mode: "nest" | "sdk";
    simulate: boolean;
    input: string;
    output: string;
  }

  export const parse = async (): Promise<IOutput> => {
    // PREPARE ASSETS
    commander.program.option("--mode [nest/sdk]", "migration mode");
    commander.program.option(
      "--input [swagger.json]",
      "location of target swagger.json file",
    );
    commander.program.option("--output [directory]", "output directory path");
    commander.program.option("--simulate", "Mockup simulator");

    // INTERNAL PROCEDURES
    const questioned = { value: false };
    const action = (closure: (options: Partial<IOutput>) => Promise<IOutput>) =>
      new Promise<IOutput>((resolve, reject) => {
        commander.program.action(async (options) => {
          try {
            resolve(await closure(options));
          } catch (exp) {
            reject(exp);
          }
        });
        commander.program.parseAsync().catch(reject);
      });
    const select =
      (name: string) =>
      (message: string) =>
      async <Choice extends string>(
        choices: Choice[],
        filter?: (value: string) => Choice,
      ): Promise<Choice> => {
        questioned.value = true;
        return (
          await inquirer.createPromptModule()({
            type: "list",
            name: name,
            message: message,
            choices: choices,
            filter,
          })
        )[name];
      };
    const input = (name: string) => async (message: string) =>
      (
        await inquirer.createPromptModule()({
          type: "input",
          name,
          message,
        })
      )[name];

    // DO CONSTRUCT
    return action(async (partial) => {
      partial.mode ??= await select("mode")("Migration mode")(
        ["NestJS" as "nest", "SDK" as "sdk"],
        (value) => (value === "NestJS" ? "nest" : "sdk"),
      );
      partial.input ??= await input("input")("Swagger file location");
      partial.output ??= await input("output")("Output directory path");
      if (partial.simulate)
        partial.simulate = (partial.simulate as any) === "true";
      else
        partial.simulate =
          (await select("simulate")("Mokup Simulator")(["true", "false"])) ===
          "true";
      return partial as IOutput;
    });
  };
}
