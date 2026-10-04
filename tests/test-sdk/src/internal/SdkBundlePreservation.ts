import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import type { ITypedApplication } from "../../../../packages/sdk/lib/structures/ITypedApplication";
import { SwaggerUnitRoute } from "./SwaggerUnitRoute";

/**
 * Generates and checks a customized SDK scaffold in a caller-owned directory.
 *
 * Direct units use the built generator; the installed connection uses its own
 * generator and retains these same files for its existing consumer compilation.
 * The shipped bundle is the byte oracle for copied files, while customized
 * module contents are authored independently before regeneration.
 *
 * @evidence contracts/common.md#principled-implementation Two calls to the actual generator surround authored edits and one deletion. Exact bytes distinguish initial copying, preservation and restoration without substituting the file writer.
 * @evidence contracts/common.md#clear-and-simple-design One scenario serves the direct filesystem unit and the installed consumer. The caller supplies the actual generator and bundle directory and owns output cleanup or subsequent compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper invokes the supplied owning operation without modifying it. Expected bundle bytes come from shipped assets and customization bytes from literals, never from the regenerated output.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the two callers, byte oracle and caller-owned lifetime, including why the installed connection retains output.
 */
export async function SdkBundlePreservation(
  generate: (app: ITypedApplication) => Promise<void>,
  bundle: string,
  output: string,
): Promise<void> {
  const files = [
    "HttpError.ts",
    "IConnection.ts",
    "index.ts",
    "module.ts",
    "Primitive.ts",
    "Resolved.ts",
  ];
  const originals = new Map(
    await Promise.all(
      files.map(
        async (file) =>
          [file, await fs.readFile(path.join(bundle, file), "utf8")] as const,
      ),
    ),
  );
  const app: ITypedApplication = {
    project: {
      config: { input: [], output },
      input: { controllers: [] },
      errors: [],
      warnings: [],
    },
    collection: {
      objects: new Map(),
      aliases: new Map(),
      arrays: new Map(),
      tuples: new Map(),
    },
    routes: [SwaggerUnitRoute()],
  };
  await generate(app);
  for (const file of files)
    assert.equal(
      await fs.readFile(path.join(output, file), "utf8"),
      originals.get(file),
      `bundle-preserve: initial ${file}`,
    );

  const customModule = [
    'export type * from "./IConnection";',
    'export * from "./HttpError";',
    'export type * from "./custom";',
    "",
    'export * as functional from "./functional/index";',
    "",
  ].join("\n");
  const customIndex = [
    'import * as api from "./module";',
    "",
    'export * from "./module";',
    'export type * from "./custom";',
    "",
    "export default api;",
    "",
  ].join("\n");
  await fs.writeFile(
    path.join(output, "custom.ts"),
    "export type Custom = { value: string };\n",
  );
  await fs.writeFile(path.join(output, "module.ts"), customModule);
  await fs.writeFile(path.join(output, "index.ts"), customIndex);
  await fs.unlink(path.join(output, "HttpError.ts"));
  await generate(app);
  assert.equal(
    await fs.readFile(path.join(output, "module.ts"), "utf8"),
    customModule,
    "bundle-preserve: customized module.ts",
  );
  assert.equal(
    await fs.readFile(path.join(output, "index.ts"), "utf8"),
    customIndex,
    "bundle-preserve: customized index.ts",
  );
  for (const file of [
    "HttpError.ts",
    "IConnection.ts",
    "Primitive.ts",
    "Resolved.ts",
  ])
    assert.equal(
      await fs.readFile(path.join(output, file), "utf8"),
      originals.get(file),
      `bundle-preserve: regenerated ${file}`,
    );
}
