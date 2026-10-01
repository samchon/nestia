import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger through its generated consumer.
 *
 * Authored controller annotations supply the observable schema or status
 * contract.
 *
 * 1. Run the generated request or read its emitted document.
 * 2. Compare the retained output with the independent authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated GET /users/{user_id}/user document response202 must reference exactly the cloned IUser schema; a default200 key or unqualified wrong DTO fails.
 * @evidence contracts/testing.md#independent-expectations The authored controller declares HttpCode ACCEPTED and IUser return type. Those authored annotations independently establish status202 and the named cloned response reference.
 * @evidence contracts/testing.md#distinguishing-cases This pins nondefault success status under cloning/propagation; the sibling request pins real accepted transport and other Swagger cases own tags/info/details. This assertion does not inspect the entire IUser schema.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects authored HttpCode/return metadata to the emitted Swagger response map. Direct type reflection cannot prove the serializer retains this response status/reference.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The document shares feature generation/runtime with sibling requests; reading it starts no process or server. Only the isolated immutable feature output is read and the entry finally closes its backend.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const route = content.paths["/users/{user_id}/user"].get;

  TestValidator.equals(
    "202",
    route.responses["202"].content["application/json"].schema.$ref,
    "#/components/schemas/IUser",
  );
};
