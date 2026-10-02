import typia from "typia";

import api from "@api";
import { ISeller } from "@api/lib/structures/ISeller";

/**
 * Verifies calls encrypted seller join and validates ISeller.
 *
 * The authored join fields and ISeller DTO supply the independent input and
 * output domains.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export async function test_api_seller_join(
  connection: api.IConnection,
): Promise<void> {
  const seller: ISeller = await api.functional.sellers.authenticate.join(
    connection,
    {
      email: "someone@someone.com",
      name: "Someone",
      mobile: "01012345678",
      company: "Some Company",
      password: "qweqwe123!",
    },
  );
  typia.assert(seller);
}
