import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies clone generation retains controller and operation Swagger tags.
 *
 * Private cloned DTOs and actual tag decorators reach the installed SDK writer;
 * this original document-only fixture has no generated random transport cases.
 *
 * 1. Read the Swagger document generated from the compiled clone tag controllers.
 * 2. Assert store and update tags exactly equal the authored bbs/public/write
 *    lists.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual generated store and update operations must contain the exact bbs/public/write tag arrays, retaining both JSDoc and ApiTags composition.
 * @evidence contracts/testing.md#independent-expectations Literal tag lists come from the authored controller and method decorators; output never supplies the expected list.
 * @evidence contracts/testing.md#distinguishing-cases Store uses authored JSDoc operation tags and update uses ApiTags; both retain the controller tag. Private cloned DTOs and custom tagged transaction input remain generated and compiled without inventing automatic transport execution.
 * @evidence contracts/testing.md#execution-ownership The shared public consumer discovers this matching authored case, with no installation, compiler or application created by the case.
 * @evidence contracts/e2e.md#necessary-boundary Native metadata for private cloned DTOs and tag decorators must reach the actual installed public Swagger writer; direct authored metadata units cannot establish this connection.
 * @evidence contracts/e2e.md#shared-execution This distinct clone option profile shares one installed graph, native producer, compiled consumer and listener. Its public non-listening input graph selects only its two original controllers and closes after generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique controller, route and private DTO identities isolate this graph. The profile document has a separate output path and this case only reads it; the runner owns every application lifetime.
 * @evidence contracts/e2e.md#preserved-coverage Both original exact Swagger tag assertions remain after reversible function, route and document-location changes. The original configuration omitted automatic E2E generation, which remains omitted.
 */
export const test_clone_tags_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../../../profiles/tags/swagger.json",
      "utf8",
    ),
  );
  TestValidator.equals(
    "tags of store()",
    swagger.paths["/http_rich/clone/tags/bbs/articles/{section}"].post.tags,
    ["bbs", "public", "write"],
  );
  TestValidator.equals(
    "tags of update()",
    swagger.paths["/http_rich/clone/tags/bbs/articles/{section}/{id}"].put.tags,
    ["bbs", "public", "write"],
  );
};
