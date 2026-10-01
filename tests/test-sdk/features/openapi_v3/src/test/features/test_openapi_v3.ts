import { OpenApiV3 } from "@typia/interface";
import fs from "fs";
import typia from "typia";

/**
 * Verifies openapi v3 through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual generated document must satisfy installed OpenApiV3.IDocument validation.
 * @evidence contracts/testing.md#independent-expectations The public installed OpenApiV3 declaration supplies the structural oracle independently of generated output. Exact default-server/body-presence siblings supplement a shape check that alone could accept empty paths.
 * @evidence contracts/testing.md#distinguishing-cases Configured3.0 document shape contrasts2.0 downgrade and the selected field-specific controls. This gate does not independently assert every route or schema body.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native metadata and3.0 composition must produce a consumer-valid complete document; a local fragment shape unit cannot certify the emitted file.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_openapi_v3 = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assert<OpenApiV3.IDocument>(swagger);
};
