import { program } from "commander";
import { createPromptModule } from "inquirer";

export namespace NestiaMigrateInquirer {
  export interface IOutput {
    mode: "nest" | "sdk";
    input: string;
    output: string;
    keyword: boolean;
    simulate: boolean;
    e2e: boolean;
    package: string;
  }

  export const parse = async (): Promise<IOutput> => {
    // PREPARE ASSETS
    program.option("--mode [nest/sdk]", "migration mode");
    program.option(
      "--input [swagger.json]",
      "location of target swagger.json file",
    );
    program.option("--output [directory]", "output directory path");
    program.option("--keyword [boolean]", "Keyword parameter mode");
    program.option("--simulate [boolean]", "Mockup simulator");
    program.option("--e2e [boolean]", "Generate E2E tests");
    program.option("--package [name]", "Package name");

    // INTERNAL PROCEDURES
    const questioned = { value: false };
    const action = (closure: (options: Partial<IOutput>) => Promise<IOutput>) =>
      new Promise<IOutput>((resolve, reject) => {
        program.action(async (options) => {
          try {
            resolve(await closure(options));
          } catch (exp) {
            reject(exp);
          }
        });
        program.parseAsync().catch(reject);
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
          await createPromptModule()({
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
        await createPromptModule()({
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
      partial.output ??= await input("output")("Response directory path");
      partial.package ??= await input("package")("Package name");
      partial.keyword ??=
        (await select("keyword")("Keyword parameter mode")([
          "true",
          "false",
        ])) === "true";

      if (partial.keyword)
        partial.keyword = (partial.keyword as any) === "true";
      else
        partial.keyword =
          (await select("keyword")("Keyword parameter mode")([
            "true",
            "false",
          ])) === "true";
      if (partial.simulate)
        partial.simulate = (partial.simulate as any) === "true";
      else
        partial.simulate =
          (await select("simulate")("Mokup Simulator")(["true", "false"])) ===
          "true";

      if (partial.e2e) partial.e2e = (partial.e2e as any) === "true";
      else
        partial.e2e =
          (await select("e2e")("Generate E2E tests")(["true", "false"])) ===
          "true";
      return partial as IOutput;
    });
  };
}
