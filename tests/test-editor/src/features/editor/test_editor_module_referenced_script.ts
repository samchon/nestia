import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies editor setup serves the script named by its built page.
 *
 * Directory enumeration does not identify the entry bundle; a map or another
 * bundle can precede it without changing the page's intended entry script.
 *
 * 1. Copy the built module into an isolated fixture with two assets.
 * 2. Register its routes and read the page-referenced JavaScript handler.
 * 3. Assert the unrelated asset is absent and a missing reference rejects setup.
 *
 * @evidence contracts/testing.md#behavioral-verification Built setup registers and serves the authored referenced script while ignoring an earlier map; replacing the page with no external script must reject rather than choose an arbitrary directory entry.
 * @evidence contracts/testing.md#independent-expectations The fixture page names selected.js and the file contains an authored distinct string. These inputs independently identify the intended route and content.
 * @evidence contracts/testing.md#distinguishing-cases An earlier map is the negative twin for the script, duplicate references must register once, and no external script is the empty boundary.
 * @evidence contracts/testing.md#execution-ownership Unit: a copied built module reads an inert fixture and uses a recording adapter in the test-editor unit process; no Nest server or HTTP request starts, and finally removes only the owned root.
 */
export const test_editor_module_referenced_script = async (): Promise<void> => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-editor-assets-"));
  try {
    fs.cpSync(
      path.resolve(process.cwd(), "../../packages/editor/lib"),
      path.join(root, "lib"),
      { recursive: true },
    );
    const dist = path.join(root, "dist");
    fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
    fs.writeFileSync(path.join(dist, "assets/aaa.map"), "wrong asset");
    fs.writeFileSync(
      path.join(dist, "assets/selected.js"),
      "window.selected = true;",
    );
    const index = path.join(dist, "index.html");
    fs.writeFileSync(
      index,
      '<script type="module" src="./assets/selected.js"></script><script src="./assets/selected.js"></script>',
    );
    const { NestiaEditorModule } = require(
      path.join(root, "lib/NestiaEditorModule.js"),
    ) as { NestiaEditorModule: { setup: (props: object) => Promise<void> } };
    const routes = new Map<string, (req: unknown, res: object) => unknown>();
    const props = {
      path: "editor",
      application: {
        getHttpAdapter: () => ({
          get: (
            route: string,
            handler: (req: unknown, res: object) => unknown,
          ) => {
            TestValidator.equals(
              `unique route ${route}`,
              routes.has(route),
              false,
            );
            routes.set(route, handler);
          },
        }),
      },
      swagger: {
        openapi: "3.1.0",
        info: { title: "t", version: "1" },
        paths: {},
      },
    };
    await NestiaEditorModule.setup(props);
    let content = "";
    routes.get("/editor/assets/selected.js")!(
      {},
      {
        type: () => undefined,
        send: (text: string) => {
          content = text;
        },
      },
    );
    TestValidator.equals(
      "selected script content",
      content,
      "window.selected = true;",
    );
    TestValidator.equals(
      "unreferenced asset absent",
      routes.has("/editor/assets/aaa.map"),
      false,
    );
    fs.writeFileSync(index, "<script>window.inline = true;</script>");
    const error = await NestiaEditorModule.setup(props).then(
      () => null,
      (error: unknown) => error,
    );
    TestValidator.predicate(
      "missing script reference rejects",
      error instanceof Error &&
        error.message.includes("references no JavaScript asset"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
