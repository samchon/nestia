import { NestiaMigrateApplication } from "../../../../packages/migrate/lib";
import { NestiaMigrateInquirer } from "../../../../packages/migrate/lib/executable/NestiaMigrateInquirer";

/**
 * Verifies migration flags preserve bare, true and false boolean values.
 *
 * Commander returns boolean true for a bare flag and text for an explicit
 * value. Parsing each invocation independently also prevents a previous true
 * value from masking a subsequent false value without starting another CLI.
 *
 * 1. Parse all three keyword spellings through the built command's parser.
 * 2. Pass each result to the actual Nest project writer and check its config.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual argument parser and Nest writer must preserve bare/true/false keyword values in nestia.config.ts, exposing the historical string-only flag defect.
 * @evidence contracts/testing.md#independent-expectations Commander optional flags are true when bare and retain their textual value when supplied; literal true/true/false expectations establish the generated option contract.
 * @evidence contracts/testing.md#distinguishing-cases A false keyword invocation follows two true invocations, while explicit false simulate/e2e controls must remain false on every invocation.
 * @evidence contracts/testing.md#execution-ownership The migrate entry awaits this direct parser/writer unit against built package artifacts; it creates no child process, consumer installation or product compilation.
 */
export const test_migrate_cli_boolean_flags = async (): Promise<void> => {
  for (const [flag, expected] of [
    [["--keyword"], true],
    [["--keyword", "true"], true],
    [["--keyword", "false"], false],
  ] as const) {
    const options = await NestiaMigrateInquirer.parse([
      process.execPath,
      "nestia-migrate",
      ...["--mode", "nest", "--input", "swagger.json", "--output", "output"],
      ...flag,
      ...["--simulate", "false", "--e2e", "false", "--package", "cli"],
    ]);
    if (options.keyword !== expected || options.simulate || options.e2e)
      throw new Error(`${flag.join(" ")} parsed incorrect boolean flags.`);
    const config = NestiaMigrateApplication.assert({
      openapi: "3.1.0",
      info: { title: "cli", version: "1.0.0" },
      paths: {},
    }).nest(options)["packages/backend/nestia.config.ts"];
    if (config?.includes(`keyword: ${expected}`) !== true)
      throw new Error(
        `${flag.join(" ")} should migrate keyword: ${expected}:\n${config}`,
      );
  }
};
