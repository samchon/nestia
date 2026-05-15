import { TestValidator } from "@nestia/e2e";
import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  OpenApi,
} from "@typia/interface";
import { HttpLlm } from "@typia/utils";
import cp from "child_process";
import fs from "fs";

/**
 * Verifies @HumanRoute endpoints are excluded from `HttpLlm.application()`'s
 * tool list while remaining present in the underlying Swagger document.
 *
 * `@HumanRoute` is the marker that splits the API surface: human-only
 * endpoints stay in OpenAPI but must not appear in the LLM tool catalog
 * (otherwise an agent could call them). A regression that drops the
 * `x-samchon-human` extension or that `HttpLlm.application` stops
 * honoring it would silently expose human-only routes to LLM callers.
 *
 *  1. Generate `swagger.json` for the fixture if absent.
 *  2. Build `HttpLlm.application` from the document.
 *  3. Assert the function list omits the @HumanRoute-marked operation
 *     while the raw swagger paths still include it.
 */
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
