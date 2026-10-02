const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const sdk = path.resolve(__dirname, "../../packages/sdk");
const { parse } = require(require.resolve("@babel/parser", { paths: [sdk] }));
const {
  SdkWebSocketCloneProgrammer,
} = require("../../packages/sdk/lib/generates/internal/SdkWebSocketCloneProgrammer");

/**
 * Verifies cloned WebSocket declarations retain unique, resolvable imports.
 *
 * A mixed import contains a cloneable interface and a source-only value.
 * Cloning the interface must not repeat its binding in the retained import;
 * retained value, default and namespace bindings must resolve from the new
 * structures directory to their original authored source.
 *
 * 1. Write mixed named, default and namespace imports in an ignored fixture.
 * 2. Invoke the actual declaration writer and parse its emitted imports.
 * 3. Assert unique bindings, retained type modifiers and resolved identities.
 */
const main = async () => {
  const directory = await fs.mkdtemp(
    path.join(__dirname, ".tmp-clone-imports-"),
  );
  const source = path.join(directory, "src");
  const output = path.join(directory, "api");
  try {
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(
      path.join(source, "Child.ts"),
      'export interface Child { value: string; }\nexport const TOKEN = "literal";\n',
    );
    await fs.writeFile(
      path.join(source, "Defaults.ts"),
      "export default interface DefaultThing { fallback: boolean; }\n",
    );
    await fs.writeFile(
      path.join(source, "Root.ts"),
      [
        'import { type Child as Alias, TOKEN } from "./Child";',
        'import type DefaultThing from "./Defaults";',
        'import * as SourceNamespace from "./Child";',
        "export interface Root {",
        "  child: Alias; token: typeof TOKEN;",
        "  fallback: DefaultThing; namespace: SourceNamespace.Child;",
        "}",
      ].join("\n"),
    );
    const cloned = await SdkWebSocketCloneProgrammer.write({
      project: { config: { output } },
      routes: [
        {
          protocol: "websocket",
          imports: [{ file: path.join(source, "Root.ts"), elements: ["Root"] }],
        },
      ],
    });
    assert.ok(cloned.has(`${path.join(source, "Root.ts")}#Root`));
    const target = path.join(output, "structures", "Root.ts");
    const ast = parse(await fs.readFile(target, "utf8"), {
      sourceType: "module",
      plugins: ["typescript"],
    });
    const bindings = new Map();
    for (const declaration of ast.program.body) {
      if (declaration.type !== "ImportDeclaration") continue;
      for (const specifier of declaration.specifiers) {
        assert.equal(bindings.has(specifier.local.name), false);
        bindings.set(specifier.local.name, {
          file: await fs.realpath(
            path.resolve(
              path.dirname(target),
              `${declaration.source.value}.ts`,
            ),
          ),
          kind: declaration.importKind,
          imported: specifier.imported?.name,
        });
      }
    }
    assert.deepEqual([...bindings.keys()].sort(), [
      "Alias",
      "DefaultThing",
      "SourceNamespace",
      "TOKEN",
    ]);
    assert.equal(
      bindings.get("Alias").file,
      await fs.realpath(path.join(output, "structures", "Child.ts")),
    );
    assert.equal(bindings.get("Alias").kind, "type");
    assert.equal(bindings.get("Alias").imported, "Child");
    for (const name of ["TOKEN", "SourceNamespace"])
      assert.equal(
        bindings.get(name).file,
        await fs.realpath(path.join(source, "Child.ts")),
      );
    assert.equal(bindings.get("TOKEN").kind, "value");
    assert.equal(
      bindings.get("DefaultThing").file,
      await fs.realpath(path.join(source, "Defaults.ts")),
    );
    assert.equal(bindings.get("DefaultThing").kind, "type");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
};
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
