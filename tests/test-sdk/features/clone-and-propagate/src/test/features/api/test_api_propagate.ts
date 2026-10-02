import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "@api";
import { IUser } from "@api/lib/structures/IUser";

/**
 * Verifies calls getUserProfile and validates its propagated 202 or 404
 * response structure.
 *
 * The authored controller and IPropagation union establish permitted status and
 * payload combinations.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_propagate = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: IPropagation<
    {
      202: IUser;
      404: "404 Not Found";
    },
    202
  > = await api.functional.users.user.getUserProfile(connection, "something", {
    user_type: "admin",
  });
  typia.assert(output);
};
