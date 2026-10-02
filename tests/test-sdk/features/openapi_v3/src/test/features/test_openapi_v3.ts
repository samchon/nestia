import { OpenApiV3 } from "@typia/interface";
import fs from "fs";
import typia from "typia";

/**
 * Verifies the generated document satisfies the OpenAPI 3.0 document shape.
 *
 * The complete-document assertion complements the focused response and
 * placeholder-server checks.
 *
 * 1. Execute the authored fixture's generated client or read its generated
 *    document.
 * 2. Assert the independently defined behavior and shape.
 */
export const test_openapi_v3 = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assert<OpenApiV3.IDocument>(swagger);
};
