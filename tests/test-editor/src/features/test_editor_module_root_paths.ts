import path from "path";

import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies empty and slash-only prefixes register the editor at the root.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual setup operation with a route-recording HTTP adapter and asserts root page/document/asset paths have one leading slash and one root redirect.
 * @evidence contracts/testing.md#independent-expectations HTTP root paths use one leading slash; joining empty prefix segments must not create a distinct double-slash route, and the configured nonempty prefix must remain intact.
 * @evidence contracts/testing.md#distinguishing-cases Empty and slash-only path/global-prefix combinations are paired with api/editor as the adjacent nonroot case.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct setup unit in test-editor. The adapter records registration through the supplied application boundary; no host or transport connection is started.
 */
export const test_editor_module_root_paths = async (): Promise<void> => {
  const { NestiaEditorModule } = require(
    path.join(EditorTestHarness.LIB, "NestiaEditorModule.js"),
  );
  for (const [globalPrefix, editorPath, prefix] of [
    ["", "", ""],
    ["///", "///", ""],
    ["/api//", "/editor/", "/api/editor"],
  ] as const) {
    const routes: string[] = [];
    const application = {
      config: { globalPrefix },
      getHttpAdapter: () => ({ get: (route: string) => routes.push(route) }),
    };
    await NestiaEditorModule.setup({
      path: editorPath,
      application,
      swagger: {
        openapi: "3.1.0",
        info: { title: "root", version: "1.0.0" },
        paths: {},
      },
    });
    for (const suffix of ["/index.html", "/swagger.json"])
      if (!routes.includes(prefix + suffix))
        throw new Error(`Missing ${prefix + suffix}: ${routes}`);
    if (!routes.some((route) => route.startsWith(prefix + "/assets/")))
      throw new Error(`Missing editor asset route: ${routes}`);
    if (routes.some((route) => route.includes("//")))
      throw new Error(`Double-slash route: ${routes}`);
    if (prefix === "" && routes.filter((route) => route === "/").length !== 1)
      throw new Error(`Expected one root redirect: ${routes}`);
    if (prefix !== "" && !routes.includes(prefix))
      throw new Error(`Missing prefix redirect: ${routes}`);
  }
};
