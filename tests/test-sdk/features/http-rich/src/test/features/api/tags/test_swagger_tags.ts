import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies controller, method and comment tags reach the generated document.
 *
 * Store and update declare the same groups through different metadata paths.
 * Both must retain the authored group order after shared generation.
 *
 * 1. Read the fresh document produced from the installed controllers.
 * 2. Compare exact store and update tag order against the authored list.
 *
 * @evidence contracts/testing.md#behavioral-verification Fresh Swagger output preserves the exact ordered bbs/public/write tags for both store and update methods from actual class, method and JSDoc metadata.
 * @evidence contracts/testing.md#independent-expectations The original literal ordered tag list comes from authored ApiTags and JSDoc tags; generated output does not supply the expectation.
 * @evidence contracts/testing.md#distinguishing-cases Store adds public/write through comments while update supplies them through method decorators, both following the class bbs tag. Direct SDK units separately distinguish duplication, missing/conflicting/preconfigured descriptions and untagged operations.
 * @evidence contracts/testing.md#execution-ownership The matching case runs after public compilation in the installed shared consumer and reads its fresh Swagger document.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller/method decorators and compiled comments must reach the public document generator; authored composer units cannot prove this metadata connection.
 * @evidence contracts/e2e.md#shared-execution The original controllers and custom-tag parameter share the existing installed producer, generation, consumer compilation and application once.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Prefixed stateless routes and distinct DTO identities separate inputs. The OAuth2 scheme has a distinct tagsOAuth2 name with its original read/write scopes and descriptions, without merging the different security fixture scope profile.
 * @evidence contracts/e2e.md#preserved-coverage Both original ordered tag assertions remain with only recorded class/import/route/case/DTO/document identities changed. The complete authored controllers, custom parameter TagBase definitions and DTO constraints remain producer inputs; direct units own tag-selection rules.
 */
export const test_swagger_tags = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../swagger.json",
      "utf8",
    ),
  );
  TestValidator.equals(
    "tags of store()",
    swagger.paths["/http_rich/tags/bbs/articles/{section}"].post.tags,
    ["bbs", "public", "write"],
  );
  TestValidator.equals(
    "tags of update()",
    swagger.paths["/http_rich/tags/bbs/articles/{section}/{id}"].put.tags,
    ["bbs", "public", "write"],
  );
};
