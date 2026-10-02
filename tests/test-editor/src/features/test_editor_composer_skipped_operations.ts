import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies the editor reports every operation it leaves out of a project.
 *
 * `@nestia/migrate` records an operation it cannot convert, such as one
 * answering `application/octet-stream`, in its errors, which the CLI prints.
 * The editor returned the files alone, so the downloaded project silently
 * lacked the operation (#1686).
 *
 * 1. Compose a document with a convertible and an unconvertible operation.
 * 2. Assert the output names the skipped one with migrate's message.
 * 3. Assert a document without such operations reports none.
 *
 * @evidence contracts/testing.md#behavioral-verification Both public composition modes must report the unsupported binary operation and diagnostics, while a clean JSON operation reports no omissions.
 * @evidence contracts/testing.md#independent-expectations The editor exposes converter omissions rather than silently handing out incomplete projects; literal method/path expectations identify the authored binary response.
 * @evidence contracts/testing.md#distinguishing-cases SDK and Nest each compare mixed convertible and unsupported operations against a clean document lacking the binary operation.
 * @evidence contracts/testing.md#execution-ownership The test-editor DynamicExecutor discovers this exported unit and calls built owning operations in-process without an installed consumer or live host. SSR module initialization stays separate from the browser population.
 */
export const test_editor_composer_skipped_operations =
  async (): Promise<void> => {
    const composer = EditorTestHarness.composer();
    for (const mode of ["sdk", "nest"] as const) {
      const skipped = (await compose(composer, mode, DOCUMENT)).skipped;
      if (
        skipped.length !== 1 ||
        skipped[0]!.method !== "GET" ||
        skipped[0]!.path !== "/files/{id}" ||
        skipped[0]!.messages.length === 0
      )
        throw new Error(
          `${mode}: the skipped operation is not reported: ${JSON.stringify(skipped)}`,
        );
      const clean = (
        await compose(composer, mode, {
          ...DOCUMENT,
          paths: { "/items": DOCUMENT.paths["/items"] },
        })
      ).skipped;
      if (clean.length !== 0)
        throw new Error(`${mode}: reported ${JSON.stringify(clean)}`);
    }
  };

const compose = async (
  composer: EditorTestHarness.IComposer,
  mode: "sdk" | "nest",
  document: object,
): Promise<{
  skipped: Array<{ method: string; path: string; messages: string[] }>;
}> => {
  const result = await composer[mode]({
    document,
    e2e: false,
    keyword: true,
    simulate: false,
  });
  if (result.success !== true || result.data === undefined)
    throw new Error(`${mode}: composition failed.`);
  return result.data as any;
};

const DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "Skipped operations", version: "1.0.0" },
  paths: {
    "/items": {
      get: {
        responses: {
          200: {
            description: "items",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
    "/files/{id}": {
      get: {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "binary",
            content: {
              "application/octet-stream": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    },
  },
  components: {},
};
