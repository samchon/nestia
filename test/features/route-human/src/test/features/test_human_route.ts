import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@samchon/openapi";
import { HttpLlm } from "@samchon/openapi/lib/HttpLlm";
import { IHttpLlmApplication } from "@samchon/openapi/lib/structures/IHttpLlmApplication";
import { IHttpLlmFunction } from "@samchon/openapi/lib/structures/IHttpLlmFunction";
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

  const application: IHttpLlmApplication<"chatgpt"> = HttpLlm.application({
    model: "chatgpt",
    document,
  });
  const func: IHttpLlmFunction<"chatgpt"> | undefined =
    application.functions.find(
      (func) => func.method === "get" && func.path === "/performance",
    );
  TestValidator.equals("excluded", func, undefined);
};

const LOCATION = `${__dirname}/../../../swagger.json`;
