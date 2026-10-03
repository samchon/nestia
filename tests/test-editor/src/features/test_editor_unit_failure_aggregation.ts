import assert from "assert/strict";
import path from "path";

/**
 * Verifies an SSR failure cannot suppress independent browser execution.
 *
 * The old shell conjunction stopped after SSR failure. The unit plan must
 * preserve both first results so one failed population cannot hide another.
 *
 * 1. Supply authored successful and failed SSR/browser statuses.
 * 2. Require both commands in order and the maximum failure status.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual runEditorUnitPhases calls both command boundaries after SSR failure and returns the maximum result. It retains browser-only and simultaneous failures as well as all-success behavior.
 * @evidence contracts/testing.md#independent-expectations Independent populations must both execute, and status two takes precedence over ordinary status one. Literal authored command order and status pairs establish expectations without deriving them from the plan.
 * @evidence contracts/testing.md#distinguishing-cases All success, SSR-only failure, browser-only failure and SSR2/browser1 distinguish continued execution and failure precedence; the callback records each actual command.
 * @evidence contracts/testing.md#execution-ownership The matching editor SSR unit invokes the actual portable plan through an authored execution boundary. It launches no child, compiler, consumer, DOM or product host.
 */
export const test_editor_unit_failure_aggregation = (): void => {
  const {
    runEditorUnitPhases,
  }: {
    runEditorUnitPhases: (run: (command: string) => number) => number;
  } = require(path.resolve(__dirname, "../UnitRunner.ts"));
  for (const [ssr, browser, expected] of [
    [0, 0, 0],
    [1, 0, 1],
    [0, 1, 1],
    [2, 1, 2],
  ]) {
    const commands: string[] = [];
    const result = runEditorUnitPhases((command) => {
      commands.push(command);
      return command === "test:unit:ssr" ? ssr! : browser!;
    });
    assert.deepEqual(commands, ["test:unit:ssr", "test:unit:browser"]);
    assert.equal(result, expected);
  }
};
