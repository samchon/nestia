import { TestValidator } from "@nestia/e2e";
import fs from "fs";

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
