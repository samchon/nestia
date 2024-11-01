import { TestValidator } from "@nestia/e2e";

import api from "@api";

export async function test_sdk(): Promise<void> {
  TestValidator.equals("functions")(Object.keys(api.functional).sort())([
    "hidden",
    "internal",
  ]);
}
