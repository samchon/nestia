import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the actual clone Swagger 202 response references the authored IUser.
 *
 * The original authored inputs and assertions retain their distinct SDK
 * profile.
 *
 * 1. Execute the original assertions through the shared compiled artifacts.
 * 2. Assert the original 202 JSON response local reference equals
 *    #/components/schemas/IUser.
 *
 * @evidence contracts/testing.md#behavioral-verification Assert the original 202 JSON response local reference equals #/components/schemas/IUser.
 * @evidence contracts/testing.md#independent-expectations The authored 202 response type is IUser and OpenAPI local references use #/components/schemas; their literal combination supplies the expected reference independently of generation.
 * @evidence contracts/testing.md#distinguishing-cases This propagate profile retains its original assertions; neighboring profiles preserve their distinct clone/keyword/propagate options, DTO documentation and exception-decorator inputs.
 * @evidence contracts/testing.md#execution-ownership The shared public consumer discovers this matching authored file after one compilation; the case creates no installation, compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native compiled fixture and freshly generated installed SDK/Swagger artifacts retain the original assembly or transform connection. Portable option semantics have owning Go units; this case does not launch a host for each rule.
 * @evidence contracts/e2e.md#shared-execution All profiles share one installed graph, producer program, consumer program and HTTP listener. Only public generation and non-listening application input graphs differ where options or authored controller inputs differ.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route/class identities isolate controller variants. Profile-specific output roots isolate generated APIs and documents; stateless requests share one backend and the runner closes every application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertion bodies survive reversible import, accessor, class, file and document-location changes. No random generated profile cases or authored negative/boundary assertions are dropped.
 */
export const test_clone_propagate_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../../../profiles/propagate/swagger.json",
      "utf8",
    ),
  );
  const route =
    content.paths["/http_rich/clone/propagate/users/{user_id}/user"].get;

  TestValidator.equals(
    "202",
    route.responses["202"].content["application/json"].schema.$ref,
    "#/components/schemas/IUser",
  );
};
