import { TestValidator } from "@nestia/e2e";
import path from "path";

import { EditorTestHarness } from "./internal/EditorTestHarness";

/**
 * Verifies the served editor page carries a package name verbatim, including
 * characters `String.replace` reads as replacement patterns.
 *
 * The page is the built `index.html` with the default package name replaced. A
 * replacement string expands `$&`, `$'` and similar, so a name containing them
 * was written with pieces of the page spliced in.
 *
 * 1. Register the editor routes on a recording application with package names
 *    holding `$&` and `$'`, and with a plain name and no name as controls.
 * 2. Request the index route and read the served text.
 * 3. Assert the quoted name appears exactly once and the default name is gone, or
 *    kept when no name is given.
 *
 * @evidence contracts/testing.md#behavioral-verification The served page is read through the real route handler registered by the built module, and the quoted package literal must equal JSON.stringify of the authored name exactly once, which a pattern expansion changes.
 * @evidence contracts/testing.md#independent-expectations The expected literal is JSON.stringify of the authored string, not derived from the module.
 * @evidence contracts/testing.md#distinguishing-cases Names with the two dollar patterns are the cases, a plain name is the positive control and the omitted name is the boundary that keeps the default.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-editor process against the built editor library and its built page; the application is a recording stub and no server starts.
 */
export async function test_editor_module_index_dollar_patterns(): Promise<void> {
  const { NestiaEditorModule } = require(
    path.join(EditorTestHarness.LIB, "NestiaEditorModule.js"),
  ) as {
    NestiaEditorModule: { setup: (props: object) => Promise<void> };
  };
  const index = async (name: string | undefined): Promise<string> => {
    const routes: Record<string, (req: unknown, res: object) => unknown> = {};
    const adaptor = {
      get: (route: string, handler: (req: unknown, res: object) => unknown) => {
        routes[route] = handler;
      },
    };
    await NestiaEditorModule.setup({
      path: "editor",
      application: { getHttpAdapter: () => adaptor },
      swagger: {
        openapi: "3.1.0",
        info: { title: "t", version: "1" },
        paths: {},
      },
      ...(name === undefined ? {} : { package: name }),
    });
    let served: string = "";
    routes["/editor/index.html"]!(
      {},
      { type: () => undefined, send: (text: string) => (served = text) },
    );
    return served;
  };
  const count = (text: string, part: string): number =>
    text.split(part).length - 1;

  for (const name of ["@org/$&-project", "@org/its-$'x", "@org/plain"]) {
    const text: string = await index(name);
    TestValidator.equals(
      `literal of ${name}`,
      count(text, JSON.stringify(name)),
      1,
    );
    TestValidator.equals(
      `default removed for ${name}`,
      text.includes("@ORGANIZATION/PROJECT"),
      false,
    );
  }
  TestValidator.equals(
    "default kept",
    (await index(undefined)).includes(JSON.stringify("@ORGANIZATION/PROJECT")),
    true,
  );
}
