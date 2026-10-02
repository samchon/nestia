import { SwaggerV2 } from "@typia/interface";
import fs from "fs";
import typia from "typia";

/**
 * Verifies the generated Swagger document satisfies the Swagger 2.0 document
 * shape.
 *
 * Structural validation covers the complete emitted document alongside the
 * focused body, query and default-server assertions.
 *
 * 1. Execute the authored fixture's generated client or read its generated
 *    document.
 * 2. Assert the independently defined behavior and shape.
 */
export const test_openapi_v2 = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assert<SwaggerV2.IDocument>(swagger);
};
