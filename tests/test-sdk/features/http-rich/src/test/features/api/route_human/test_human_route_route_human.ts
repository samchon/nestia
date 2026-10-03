import { TestValidator } from "@nestia/e2e";
import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  OpenApi,
} from "@typia/interface";
import { HttpLlm } from "@typia/utils";
import fs from "fs";

/**
 * Verifies human-only routes stay documented and are excluded from LLM tools.
 *
 * Raw document presence and tool-list absence distinguish removal from
 * classification; ordinary tool routes remain in the shared document.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification Fresh Swagger retains the human-only performance route with x-samchon-human true while HttpLlm.application excludes that exact operation from callable tools.
 * @evidence contracts/testing.md#independent-expectations The authored HumanRoute marker establishes human-only classification; the prefixed path is the same authored route identity within the shared input.
 * @evidence contracts/testing.md#distinguishing-cases Raw document presence and tool-list absence distinguish removal from classification; ordinary tool routes remain in the shared document.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from route-human/src/test/features/test_human_route.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_human_route_route_human = async (): Promise<void> => {
  const document: OpenApi.IDocument = JSON.parse(
    await fs.promises.readFile(LOCATION, "utf8"),
  );
  TestValidator.equals(
    "human",
    document.paths?.["/http_rich/route_human/performance"]?.get?.[
      "x-samchon-human"
    ],
    true,
  );

  const application: IHttpLlmApplication = HttpLlm.application({
    document,
  });
  const func: IHttpLlmFunction | undefined = application.functions.find(
    (func) =>
      func.method === "get" &&
      func.path === "/http_rich/route_human/performance",
  );
  TestValidator.equals("excluded", func, undefined);
};

const LOCATION = `${__dirname}/../../../../../swagger.json`;
