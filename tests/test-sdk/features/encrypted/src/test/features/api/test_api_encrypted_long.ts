import { RandomGenerator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies sends a million-character company field through encrypted join and
 * validates ISeller.
 *
 * The authored ISeller contract permits a string company and defines the
 * expected decrypted response shape.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_encrypted_long = async (
  connection: api.IConnection,
): Promise<void> => {
  const seller: ISeller = await api.functional.sellers.authenticate.join(
    connection,
    {
      email: "someone@someone.com",
      name: "Someone",
      mobile: "01012345678",
      company: RandomGenerator.alphabets(1_000_000),
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);
};
