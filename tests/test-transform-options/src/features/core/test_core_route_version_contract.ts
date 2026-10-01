import { TestValidator } from "@nestia/e2e";
import { createRequire } from "module";
import path from "path";

/**
 * Verifies core URI-version precedence preserves explicit empty metadata.
 *
 * 1. Load core's built policy and its Nest neutral symbol.
 * 2. Apply the shared handwritten version controls.
 * 3. Distinguish absent metadata from an explicitly empty version list.
 *
 * @evidence contracts/testing.md#behavioral-verification Each real policy result must equal the literal expected URI segments. An empty method, controller or default list must yield no paths instead of inheriting a fallback.
 * @evidence contracts/testing.md#independent-expectations The shared controls follow Nest's URI routing contract; its actual RoutePathFactory reproduced no paths for an empty method list while the former core policy yielded the controller version.
 * @evidence contracts/testing.md#distinguishing-cases Method and controller precedence, empty and absent values, defaults, neutral versions, duplicates, prefixes and disabled versioning share the same controls as the SDK consumer.
 * @evidence contracts/testing.md#execution-ownership This core unit is discovered by its package entry and loads built artifacts directly, with no compiler, installation or server. Its common fixture retains no state.
 */
export const test_core_route_version_contract = (): void => {
  const { routeVersionContract } = require(
    path.resolve("../internal/route-version-contract.cjs"),
  );
  const own = createRequire(path.resolve("../../packages/core/package.json"));
  const { VERSION_NEUTRAL } = own("@nestjs/common");
  const { VersioningStrategy } = own("./lib/utils/VersioningStrategy");
  for (const test of routeVersionContract(VERSION_NEUTRAL))
    TestValidator.equals(
      test.name,
      VersioningStrategy.merge(test.config)({
        controller: test.controller,
        method: test.method,
      }),
      test.expected,
    );
  TestValidator.equals(
    "absent cast",
    VersioningStrategy.cast(undefined),
    undefined,
  );
  TestValidator.equals("empty cast", VersioningStrategy.cast([]), []);
};
