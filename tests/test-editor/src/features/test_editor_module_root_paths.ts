import path from "path";

import { EditorTestHarness } from "../internal/EditorTestHarness";

/**
 * Verifies empty and slash-only prefixes register the editor at the root.
 *
 * An empty normalized prefix must expose one root redirect. Registering an
 * empty route or a second slash would depend on the HTTP adapter's behavior.
 *
 * 1. Register the editor with empty, slash-only, and nonempty prefixes.
 * 2. Check page, document, asset, and redirect paths recorded by the adapter.
 *
 * @evidence contracts/testing.md#behavioral-verification Authored adapters record page, document, asset and redirect routes for empty/slash-only/nonempty prefixes without double slashes.
 * @evidence contracts/testing.md#independent-expectations Literal prefix normalization and a single root redirect follow the route-registration contract independently of recorded output.
 * @evidence contracts/testing.md#distinguishing-cases Empty and slash-only variants require exactly one root route; nonempty registration separately requires its prefix redirect.
 * @evidence contracts/testing.md#execution-ownership The isolated editor SSR unit entry discovers this direct case and consumes caller-built operations through its ordinary artifact view. Composition/archive operations return in-memory results, not installed or compiled projects.
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
