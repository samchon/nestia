import assert from "assert/strict";
import path from "path";

import { ImportDictionary } from "../../../../packages/sdk/lib/generates/internal/ImportDictionary";

/**
 * Verifies SDK import composition removes source suffixes while retaining
 * package paths, unrelated suffixes and each binding's type/value role.
 *
 * A .d.ts suffix must be removed as a whole rather than leaving .d in the
 * import. Package runtime specifiers have a different identity and must keep
 * their explicit suffix. Direct composition owns these decisions; the shared
 * installed consumer owns their actual generation and executable connection.
 *
 * 1. Compose named, default and namespace imports for eleven source suffixes.
 * 2. Check the exact module and type/value clause for all sixty-six controls.
 * 3. Check package/unrelated suffixes and merging of equivalent source paths.
 *
 * @evidence contracts/testing.md#behavioral-verification The built ImportDictionary must produce ./Article for each authored TypeScript/JavaScript source suffix and the requested type or value clause for named/default/namespace bindings. It must retain unrelated and package suffixes and merge two source spellings of the same module into one declaration.
 * @evidence contracts/testing.md#independent-expectations Eleven literal source suffixes enumerate TypeScript/JavaScript and declaration file spellings. The sibling Article filename independently establishes ./Article; JSON/native/text suffixes and the package runtime.js specifier are outside that source-suffix contract. Authored declaration booleans establish the clause role.
 * @evidence contracts/testing.md#distinguishing-cases Every source suffix has type/value twins and all three binding forms. Declaration suffixes distinguish whole-suffix removal from stripping only .ts/.mts/.cts. Unrelated and package suffixes reject overmatching, and equivalent .d.ts/.ts registrations distinguish normalization before merging.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching function/file and calls the caller-built dictionary directly with authored lexical paths. It installs no consumer, creates no files, compiles no fixture and starts no application. The shared public generation and compiler/runtime cases retain the installed connection formerly accompanied by repeated whole-fixture import scans.
 */
export const test_sdk_import_source_extensions = (): void => {
  const directory = path.resolve("authored-import-input");
  const extensions = [
    ".d.ts",
    ".d.mts",
    ".d.cts",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
  ];
  const bindings = ["element", "default", "asterisk"] as const;
  for (const extension of extensions)
    for (const type of bindings)
      for (const declaration of [true, false]) {
        const imports = new ImportDictionary(path.join(directory, "main.ts"));
        imports.internal({
          type,
          file: path.join(directory, `Article${extension}`),
          name: "Article",
          declaration,
        });
        const nodes = imports.toStatements(directory);
        assert.equal(nodes.length, 1);
        const node = nodes[0];
        assert(node);
        const clause = Reflect.get(node, "importClause");
        assert.equal(
          Reflect.get(Reflect.get(node, "moduleSpecifier"), "text"),
          "./Article",
        );
        assert.equal(
          Reflect.get(clause, "phaseModifier"),
          declaration ? "type" : undefined,
        );
        if (type === "default")
          assert.equal(Reflect.get(clause, "name").text, "Article");
        else if (type === "asterisk")
          assert.equal(
            Reflect.get(clause, "namedBindings").name.text,
            "Article",
          );
        else {
          const elements = Reflect.get(clause, "namedBindings").elements;
          assert.equal(elements.length, 1);
          assert.equal(elements[0].name.text, "Article");
          assert.equal(elements[0].isTypeOnly, false);
        }
      }
  for (const extension of ["", ".json", ".node", ".txt"]) {
    const imports = new ImportDictionary(path.join(directory, "main.ts"));
    imports.internal({
      type: "element",
      file: path.join(directory, `Article${extension}`),
      name: "Article",
      declaration: true,
    });
    const node = imports.toStatements(directory)[0];
    assert(node);
    assert.equal(
      Reflect.get(Reflect.get(node, "moduleSpecifier"), "text"),
      `./Article${extension}`,
    );
  }
  const external = new ImportDictionary(path.join(directory, "main.ts"));
  external.external({
    type: "element",
    file: "package/runtime.js",
    name: "runtime",
    declaration: false,
  });
  const externalNode = external.toStatements(directory)[0];
  assert(externalNode);
  assert.equal(
    Reflect.get(Reflect.get(externalNode, "moduleSpecifier"), "text"),
    "package/runtime.js",
  );
  const merged = new ImportDictionary(path.join(directory, "main.ts"));
  for (const [suffix, name] of [
    [".d.ts", "ArticleA"],
    [".ts", "ArticleB"],
  ] as const)
    merged.internal({
      type: "element",
      file: path.join(directory, `Article${suffix}`),
      name,
      declaration: true,
    });
  const nodes = merged.toStatements(directory);
  assert.equal(nodes.length, 1);
  const node = nodes[0];
  assert(node);
  assert.deepEqual(
    Reflect.get(
      Reflect.get(node, "importClause"),
      "namedBindings",
    ).elements.map((element: { name: { text: string } }) => element.name.text),
    ["ArticleA", "ArticleB"],
  );
};
