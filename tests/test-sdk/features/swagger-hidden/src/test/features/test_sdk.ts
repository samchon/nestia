import { TestValidator } from "@nestia/e2e";

import api from "@api";

export async function test_sdk(): Promise<void> {
  TestValidator.equals("functions", Object.keys(api.functional).sort(), [
    "internal",
    "swagger_excluded_controller",
    "swagger_excluded_endpoint",
    "swagger_visible_endpoint",
  ]);
}
