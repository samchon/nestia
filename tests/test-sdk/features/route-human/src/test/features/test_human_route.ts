import { TestValidator } from "@nestia/e2e";
import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  OpenApi,
} from "@typia/interface";
import { HttpLlm } from "@typia/utils";
import cp from "child_process";
import fs from "fs";

export const test_human_route = async (): Promise<void> => {
  if (fs.existsSync(LOCATION) === false)
    cp.execSync(`npx nestia swagger`, {
      stdio: "ignore",
      cwd: LOCATION,
    });
  const document: OpenApi.IDocument = JSON.parse(
    await fs.promises.readFile(LOCATION, "utf8"),
  );
  TestValidator.equals(
    "human",
    document.paths?.["/performance"]?.get?.["x-samchon-human"],
    true,
  );

  const application: IHttpLlmApplication = HttpLlm.application({
    document,
  });
  const func: IHttpLlmFunction | undefined = application.functions.find(
    (func) => func.method === "get" && func.path === "/performance",
  );
  TestValidator.equals("excluded", func, undefined);
};

const LOCATION = `${__dirname}/../../../swagger.json`;
