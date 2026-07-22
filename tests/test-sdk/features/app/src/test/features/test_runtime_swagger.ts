import typia, { OpenApi } from "typia";

/**
 * Verifies the running application exposes a valid OpenAPI document.
 *
 * Why:
 * The runtime Swagger endpoint is consumed directly by clients, so its emitted
 * document must still conform to Nestia's OpenAPI contract.
 *
 * 1. Fetch the application's configured `/api-json` endpoint.
 * 2. Validate the response against the OpenAPI document type.
 */
export const test_runtime_swagger = async (): Promise<void> => {
  const response: Response = await fetch(
    `http://127.0.0.1:${process.env.TEST_SDK_PORT ?? 37_000}/api-json`,
  );
  const document: OpenApi.IDocument = await response.json();
  typia.assert(document);
};
