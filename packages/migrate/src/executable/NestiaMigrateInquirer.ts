import { Command } from "commander";
import { createPromptModule } from "inquirer";

/**
 * Reads the options of the command from flags, asking interactively for what is
 * missing.
 *
 * @evidence contracts/common.md#principled-implementation Each option is taken from its flag when given, and asked with a prompt otherwise, so the same command runs non-interactively when every flag is present.
 * @evidence contracts/common.md#clear-and-simple-design One function and the output type; the prompt helpers are local.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prompts are the standard `inquirer` ones, and a flag always wins over a prompt.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace NestiaMigrateInquirer {
  /**
   * The options of the command: the mode, the input and output locations, the
   * flags, and the package name.
   *
   * @evidence contracts/common.md#principled-implementation The record holds the answers needed to run the migration, each as a value and not as an optional.
   * @evidence contracts/common.md#clear-and-simple-design A flat record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the options.
   */
  export interface IOutput {
    mode: "nest" | "sdk";
    input: string;
    output: string;
    keyword: boolean;
    simulate: boolean;
    e2e: boolean;
    package: string;
  }

  /**
   * Parses the flags and asks for the missing options.
   *
   * A boolean flag given without a value is `true`, and one given a value is
   * true only for the text `true`. Each invocation owns its parser; explicit
   * arguments use Node's executable/script/flags layout and default to the
   * current process arguments.
   *
   * @evidence contracts/common.md#principled-implementation A fresh Commander parser interprets the supplied Node-style arguments, the action asks a prompt for each undefined option, and boolean flags are normalized by one rule, so the result has every field set without retaining another invocation's options.
   * @evidence contracts/common.md#clear-and-simple-design One invocation owns the parser and prompt action; the optional argument vector defaults to the ordinary process input.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It asks only for what is missing.
   * @evidence contracts/common.md#meaningful-documentation The comment states the boolean flag rule.
   */
  export const parse = async (argv?: string[]): Promise<IOutput> => {
    const program = new Command();
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
        program.parseAsync(argv).catch(reject);
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
      // a flag given alone is `true`, and one given a value is its text
      const flag = (value: unknown): boolean | undefined =>
        value === undefined ? undefined : value === true || value === "true";
      const ask = async (name: string, message: string): Promise<boolean> =>
        (await select(name)(message)(["true", "false"])) === "true";
      partial.keyword =
        flag(partial.keyword) ??
        (await ask("keyword", "Keyword parameter mode"));
      partial.simulate =
        flag(partial.simulate) ?? (await ask("simulate", "Mokup Simulator"));
      partial.e2e =
        flag(partial.e2e) ?? (await ask("e2e", "Generate E2E tests"));
      return partial as IOutput;
    });
  };
}
