const assert = require("node:assert/strict");
const path = require("node:path");
const {
  isAuthoredConfiguredInput,
} = require("../integration/PublicConfiguredRunner.js");

/**
 * Verifies configured SDK inputs exclude generated remnants at every output
 * root.
 *
 * Multiple configurations can generate into nested API roots. Copying only
 * exclusions for a single output leaves those old clients in the producer and
 * can turn stale generated imports into native input diagnostics.
 *
 * 1. Supply authored controller, configuration, DTO and test source paths.
 * 2. Contrast nested SDK outputs, generated tests and compiler/install remnants.
 * 3. Require new authored DTOs to remain selected without a Git inventory.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual copy predicate accepts authored source paths and rejects prior generated clients, documents and automated tests, including both nested output roots that caused the observed producer failure.
 * @evidence contracts/testing.md#independent-expectations The fixture ownership contract assigns src/api/structures to authored DTOs and remaining API roots to generation. Literal authored and generated path pairs establish expected selection without using current generator output.
 * @evidence contracts/testing.md#distinguishing-cases Empty relative root, current and newly authored DTOs, ordinary controllers, two API roots, standard and nested outputs, hidden compiler state, dependency trees and authored-vs-automated test files cover the copy boundary.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching TypeScript export. It calls the stateless path policy directly and installs, compiles and starts nothing.
 */
export function test_sdk_configured_authored_inputs(): void {
  const authored = [
    "",
    "nestia.config.ts",
    "package.json",
    "src/Backend.ts",
    "src/controllers/NewController.ts",
    "src/api",
    "src/api/structures",
    "src/api/structures/NewDto.ts",
    "src/test/features/test_authored.ts",
  ];
  const generated = [
    "node_modules",
    "node_modules/typia/index.ts",
    "lib/index.ts",
    ".ttsx.tsconfig.json",
    "swagger.json",
    "common.swagger.json",
    "src/api/index.ts",
    "src/api/functional",
    "src/api/common/functional/performance/index.ts",
    "src/api/bbs/functional/articles/index.ts",
    "src/test/features/api/automated/test_old.ts",
    "generated/sdk/api/index.ts",
    "generated/tests/e2e/test_old.ts",
  ];
  for (const value of authored)
    assert.equal(
      isAuthoredConfiguredInput(value.split("/").join(path.sep)),
      true,
      value,
    );
  for (const value of generated)
    assert.equal(
      isAuthoredConfiguredInput(value.split("/").join(path.sep)),
      false,
      value,
    );
}
