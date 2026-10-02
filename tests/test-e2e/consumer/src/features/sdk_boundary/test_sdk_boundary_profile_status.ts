import type { IPropagation } from "@nestia/fetcher";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import typia from "typia";

import api from "../../api_propagate";
import type { ISdkBoundaryUser } from "../../api_propagate/structures/ISdkBoundaryUser";

/**
 * Verifies cloned namespaced profile metadata retains accepted202 propagation
 * and its Swagger reference.
 *
 * The original handler explicitly chooses ACCEPTED and returns a random IUser,
 * so query values must not be mistaken for the returned random profile.
 *
 * 1. Call the generated propagated profile request with the original admin query.
 * 2. Require the authored status map, actual202/success true and exact named
 *    Swagger ref.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated request must type as IPropagation of202 ISdkBoundaryUser and404 literal, pass the emitted typia assertion, and expose metadata202/status202/success true; the actual Swagger202 response must reference the cloned ISdkBoundaryUser.
 * @evidence contracts/testing.md#independent-expectations The copied original HttpCode ACCEPTED and IUser return/404 annotation establish the literal map and schema reference. The returned random profile is validated by its cloned source contract, not assumed to echo the admin query.
 * @evidence contracts/testing.md#distinguishing-cases Nondefault202 contrasts default200, source-private IUser plus its Type/ISearch/IUpdate namespace contrasts exported flat DTOs, and the declared404 literal is a compile/schema branch rather than a falsely claimed executed rejection.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this one named export after its single compilation. Its exact status-map assignment and typia validator belong to that compilation; actual transport and document mismatches reject this awaited case.
 * @evidence contracts/e2e.md#necessary-boundary Native HttpCode/namespace/clone metadata must reach actual Swagger and generated propagated fetcher behavior through the Nest handler. Direct type reflection cannot establish actual202 transport.
 * @evidence contracts/e2e.md#shared-execution The alternate propagate:true SDK shares the existing emitted application, packed installation, single consumer program and backend; the common primary generation supplies Swagger. This case starts no compiler or application.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The sdk_boundary/profiles prefix and renamed source declarations isolate the copied original input. The random output is local, the current sandbox document is immutable, and the common owner closes the host after all cases finish.
 * @evidence contracts/e2e.md#preserved-coverage Original clone-and-propagate accepted202/success true/type-map validator and Swagger202 exactref assertions retain these destinations. The original three controller inputs and nested namespace types remain copied; execution is still pending.
 */
export const test_sdk_boundary_profile_status = async (
  connection: api.IConnection,
): Promise<void> => {
  const route = api.functional.sdk_boundary.profiles.user.getUserProfile;
  const output: IPropagation<
    {
      202: ISdkBoundaryUser;
      404: "404 Not Found";
    },
    202
  > = await route(connection, "something", { user_type: "admin" });
  typia.assert(output);
  assert.equal(route.METADATA.status, 202);
  assert.equal(output.status, 202);
  assert.equal(output.success, true);
  const sandbox = path.resolve(__dirname, "../../../../..");
  const swagger = JSON.parse(
    await fs.readFile(path.join(sandbox, "swagger.json"), "utf8"),
  );
  assert.equal(
    swagger.paths["/sdk_boundary/profiles/{user_id}/user"].get.responses["202"]
      .content["application/json"].schema.$ref,
    "#/components/schemas/ISdkBoundaryUser",
  );
};
