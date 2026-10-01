import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";

/**
 * Verifies cloned declarations distinguish exact optional and explicit
 * undefined.
 *
 * The native producer supplies required and optional independently. The writer
 * must use both when choosing a question token while preserving explicit
 * undefined, quoted keys and required neighbors from the authored metadata.
 *
 * 1. Give CloneGenerator one named object with adjacent property flag controls.
 * 2. Check the actual written declaration and each literal property spelling.
 * 3. Give it an empty collection and require no unnecessary structures directory.
 *
 * @evidence contracts/testing.md#behavioral-verification CloneGenerator.write emits one named DTO with required boolean, exact optional boolean, explicit undefined union and optional quoted/numeric keys. An empty collection creates no structures directory.
 * @evidence contracts/testing.md#independent-expectations TypeScript question-token syntax follows optional=true independently of required=true; required=false contributes undefined to the value union. Literal property fragments are authored from those meanings, not captured writer output.
 * @evidence contracts/testing.md#distinguishing-cases Required/optional/undefinable flag combinations, ordinary/quoted/numeric keys and empty/nonempty collections distinguish question-token, union and unnecessary-output decisions. Native mapped/alias/recursive extraction and actual consumer assignability remain separate producer and E2E owners.
 * @evidence contracts/testing.md#execution-ownership The test-sdk entry discovers this export and directly invokes the built clone writer over authored metadata in one process. The owned filesystem is removed in finally; no project compiler, consumer installation, host, worker or CLI is started.
 */
export const test_sdk_clone_optional_property_flags =
  async (): Promise<void> => {
    const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
    const { MetadataComponents } = require(path.join(sdk, "internal/legacy"));
    const { CloneGenerator } = require(
      path.join(sdk, "generates/CloneGenerator"),
    ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
    const fixture = HandWrittenMetadata.operation({
      baked: false,
      members: [],
    });
    const object = fixture.parameters[0]?.primitive.data.components.objects[0];
    assert.ok(object);
    const property = object.properties[0];
    assert.ok(property);
    object.name = "IOptionalFlags";
    object.properties = [
      ["required", true, false],
      ["optional", true, true],
      ["explicit", false, true],
      ["undefinable", false, false],
      ["quoted-key", true, true],
      ["42", true, true],
    ].map(([name, required, optional]) => ({
      ...property,
      key: {
        ...property.key,
        constants: [
          {
            type: "string",
            values: [
              {
                value: String(name),
                tags: [],
                description: null,
                jsDocTags: [],
              },
            ],
          },
        ],
      },
      value: {
        ...property.value,
        required: Boolean(required),
        optional: Boolean(optional),
        atomics: [{ type: "boolean", tags: [] }],
      },
    }));
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-clone-flags-"));
    try {
      const write = async (
        objects: (typeof fixture.parameters)[number]["primitive"]["data"]["components"]["objects"],
        output: string,
      ) => {
        const collection = MetadataComponents.from({
          objects,
          aliases: [],
          arrays: [],
          tuples: [],
        }).dictionary;
        await CloneGenerator.write({
          project: {
            config: { input: [], output, clone: true },
            input: { controllers: [] },
            errors: [],
            warnings: [],
          },
          collection,
          routes: [],
        });
      };
      const output = path.join(root, "named");
      await write([object], output);
      const source = fs.readFileSync(
        path.join(output, "structures/IOptionalFlags.ts"),
        "utf8",
      );
      for (const fragment of [
        "required: boolean;",
        "optional?: boolean;",
        '"quoted-key"?: boolean;',
        '"42"?: boolean;',
      ])
        assert.ok(source.includes(fragment), `missing ${fragment}: ${source}`);
      for (const name of ["explicit", "undefinable"]) {
        const declaration = source.match(new RegExp(`${name}\\?: ([^;]+);`));
        assert.ok(declaration, `${name}: missing optional declaration`);
        assert.deepEqual(
          declaration[1]
            ?.split("|")
            .map((member) => member.trim())
            .sort(),
          ["boolean", "undefined"],
        );
      }
      assert.equal(source.includes("required?:"), false);
      assert.equal(source.includes("optional?: boolean | undefined"), false);
      const empty = path.join(root, "empty");
      await write([], empty);
      assert.equal(fs.existsSync(path.join(empty, "structures")), false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
