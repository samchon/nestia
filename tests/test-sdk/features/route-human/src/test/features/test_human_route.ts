import { TestValidator } from "@nestia/e2e";
import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  OpenApi,
} from "@typia/interface";
import { HttpLlm } from "@typia/utils";
import fs from "fs";

/**
 * Verifies @HumanRoute endpoints are excluded from `HttpLlm.application()`'s
 * tool list while remaining present in the underlying Swagger document.
 *
 * `@HumanRoute` is the marker that splits the API surface: human-only endpoints
 * stay in OpenAPI but must not appear in the LLM tool catalog (otherwise an
 * agent could call them). A regression that drops the `x-samchon-human`
 * extension or that `HttpLlm.application` stops honoring it would silently
 * expose human-only routes to LLM callers.
 *
 * 1. Read `swagger.json` produced by this fixture's awaited generation.
 * 2. Build `HttpLlm.application` from the document.
 * 3. Assert the function list omits the @HumanRoute-marked operation while the raw
 *    swagger paths still include it.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated performance operation must retain x-samchon-human:true yet be absent from installed HttpLlm tools, while ordinary GET /route/random remains present.
 * @evidence contracts/testing.md#independent-expectations Authored HumanRoute marks only performance; ordinary TypedRoute random remains eligible. Those declarations independently establish both exclusion and the positive catalog control.
 * @evidence contracts/testing.md#distinguishing-cases Human-only versus ordinary route rejects both exposing every route and a vacuously empty tool catalog. Missing generator output now rejects rather than launching an unrelated fallback npx command.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native marker metadata, emitted Swagger and installed HttpLlm consumer must connect. Inspecting the decorator or composing a synthetic extension alone cannot certify the generated document's catalog behavior.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_human_route = async (): Promise<void> => {
  if (fs.existsSync(LOCATION) === false)
    throw new Error(`Missing generated Swagger document: ${LOCATION}`);
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
  TestValidator.predicate(
    "ordinary route remains an LLM tool",
    application.functions.some(
      (candidate) =>
        candidate.method === "get" && candidate.path === "/route/random",
    ),
  );
};

const LOCATION = `${__dirname}/../../../swagger.json`;
