import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a generated composite query DTO has its omitted property shape.
 *
 * The CLI metadata producer must register the derived DTO in its document.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the generated OmitIQueryatomic schema exists for the authored
 *    composite query controller; this assertion only proves schema registration
 *    and does not validate its field contents.
 */
export const test_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "replace",
    true,
    !!swagger.components.schemas?.OmitIQueryatomic,
  );
};
