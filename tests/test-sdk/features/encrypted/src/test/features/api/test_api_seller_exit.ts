import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies logs in, validates ISeller and awaits the encrypted exit route.
 *
 * The authored login returns ISeller and exit returns void.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export async function test_api_seller_exit(
  connection: api.IConnection,
): Promise<void> {
  const seller: ISeller = await api.functional.sellers.authenticate.login(
    connection,
    {
      email: "someone@someone.com",
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);

  await api.functional.sellers.authenticate.exit(connection);
}
