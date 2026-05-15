import {
  IEmbedTypeScriptDiagnostic,
  IEmbedTypeScriptResult,
} from "embed-typescript";
import typia from "typia";

import api from "@api";

/**
 * Verifies SDK generation preserves an external return type imported through
 * `import type` in the source controller.
 *
 * The Go metadata emitter must keep type-only imports because generated SDK
 * declaration imports are derived from the controller import table. If the
 * metadata drops the import, the generated functional module references the
 * external DTO name without importing it.
 *
 * 1. Generate the SDK from a controller returning an external type-only import.
 * 2. Call endpoints using both clause-level and named-specifier type imports.
 * 3. Assert the generated output type is still valid through typia.
 */
export async function test_api_external_compile(
  connection: api.IConnection,
): Promise<void> {
  const result: IEmbedTypeScriptResult = await api.functional.external.compile(
    connection,
    {},
  );
  typia.assert(result);

  const diagnostic: IEmbedTypeScriptDiagnostic =
    await api.functional.external.diagnostic(connection, {
      file: null,
      category: "message",
      code: 0,
      start: 0,
      length: 0,
      messageText: "",
    });
  diagnostic.messageText;
}
