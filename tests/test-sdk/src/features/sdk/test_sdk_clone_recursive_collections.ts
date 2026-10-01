import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import type {
  MetadataArrayType,
  MetadataObjectType,
  MetadataSchema,
  MetadataTupleType,
} from "../../../../../packages/sdk/lib/internal/legacy";
import type { ITypedHttpRoute } from "../../../../../packages/sdk/lib/structures/ITypedHttpRoute";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("recursive")
class RecursiveController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies recursive collection definitions terminate through named references.
 *
 * Actual SDK-owned Absorb:true metadata retains direct X=X[] and T=[T?]
 * component cycles without aliases. A definition requires one array/tuple body,
 * while nested uses must reference its declared name. Object-mediated cycles
 * and finite collections have inline bodies and need no extra declaration.
 *
 * 1. Author the actual raw producer's recursive, optional and reference flags.
 * 2. Emit recursive declarations and routes through the owning clone writer.
 * 3. Retain equivalent reuse, nullable and cross-kind collision controls.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual routeDictionary and CloneGenerator emit finite self-referential array/optional-tuple declarations and consistent route/import names; equivalent definitions share a slot and nullable or object/recursive-collection meanings remain distinct.
 * @evidence contracts/testing.md#independent-expectations X=X[] and T=[T?] require recursive TypeScript aliases, and actual native MetadataFactory analysis supplies recursive:true/index0 plus tuple optional:true/required:false. Independently authored nullable edges admit values the unchanged declarations reject. Object-mediated and finite neighbors have recursive:false and remain inline.
 * @evidence contracts/testing.md#distinguishing-cases Array versus tuple, nullable versus required self edge, equivalent versus distinct graphs, object versus same-name recursive collection, object-mediated recursion versus direct recursion, finite array/optional tuple and tagged array-reference imports pin separate decisions.
 * @evidence contracts/testing.md#execution-ownership The test-sdk entry discovers this matching sole export. Authored resolved metadata calls direct dictionary, CloneGenerator and referencer operations; only caller-owned writer output is created and cleaned in finally. Native raw producer proof belongs to TestSyntheticRecursiveCollectionAnalysis; optional recursive tuple support in the raw clone graph does not imply acceptance by the public JSON-schema API, whose optional-undefined tuple validation is separate. Native JSON-schema bake and installed consumer acceptance remain separate owning gates.
 */
export const test_sdk_clone_recursive_collections = async (): Promise<void> => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { TypedHttpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  const { CloneGenerator } = require(
    path.join(sdk, "generates/CloneGenerator"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: false, members: [] }),
    RecursiveController.prototype,
    "get",
  );
  const baseline = SwaggerCompositionHarness.routes(RecursiveController)[0]!;
  const object = baseline.queryObject!.metadata.objects[0]!
    .type as MetadataObjectType;
  const empty = (): MetadataSchema => ({
    ...structuredClone(object.properties[0]!.value),
    atomics: [],
  });
  const number = (): MetadataSchema => ({
    ...empty(),
    atomics: [{ type: "number", tags: [] }],
  });
  const recursive = (
    kind: "array" | "tuple",
    name: string,
    nullable = false,
  ): MetadataSchema => {
    const metadata = empty();
    const child = { ...empty(), nullable };
    if (kind === "array") {
      const type: MetadataArrayType = {
        name,
        index: 0,
        recursive: true,
        nullables: [false],
        value: child,
      };
      metadata.arrays = [{ name, tags: [], type }];
      child.arrays = [{ name, tags: [], type }];
    } else {
      child.optional = true;
      child.required = false;
      const type: MetadataTupleType = {
        name,
        index: 0,
        recursive: true,
        nullables: [false],
        elements: [child],
      };
      metadata.tuples = [{ name, tags: [], type }];
      child.tuples = [{ name, tags: [], type }];
    }
    return metadata;
  };
  const route = (metadata: MetadataSchema, owner: string): ITypedHttpRoute => ({
    ...baseline,
    imports: [],
    controller: {
      ...baseline.controller,
      class: { ...baseline.controller.class, name: owner },
    },
    queryObject: {
      ...baseline.queryObject!,
      metadata,
      type: { name: "stale" },
    },
  });
  const write = async (
    routes: ITypedHttpRoute[],
    check: (
      root: string,
      collection: ReturnType<typeof TypedHttpRouteAnalyzer.routeDictionary>,
    ) => void,
  ): Promise<void> => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-recursive-clone-"),
    );
    try {
      const collection = TypedHttpRouteAnalyzer.routeDictionary(routes);
      await CloneGenerator.write({
        project: {
          config: { input: [], output: root, clone: true },
          input: { controllers: [] },
          errors: [],
          warnings: [],
        },
        collection,
        routes,
      });
      check(root, collection);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
  for (const kind of ["array", "tuple"] as const) {
    const name = kind === "array" ? "X" : "T";
    const routes = [
      route(recursive(kind, name), "First"),
      route(recursive(kind, name, true), "Second"),
      route(recursive(kind, name), "Equivalent"),
    ];
    await write(routes, (root, collection) => {
      assert.equal(
        (kind === "array" ? collection.arrays : collection.tuples).size,
        2,
      );
      for (const [index, owner] of ["First", "Second", "First"].entries()) {
        assert.equal(routes[index]!.queryObject!.type.name, `${owner}.${name}`);
        assert.ok(
          routes[index]!.imports.some((entry) =>
            entry.elements.includes(owner),
          ),
        );
      }
      const first = fs.readFileSync(
        path.join(root, "structures", "First.ts"),
        "utf8",
      );
      const second = fs.readFileSync(
        path.join(root, "structures", "Second.ts"),
        "utf8",
      );
      if (kind === "array") {
        assert.match(first, /export type X = First\.X\[\]/);
        assert.match(second, /export type X = \(null \| Second\.X\)\[\]/);
      } else {
        assert.match(first, /export type T = \[\(undefined \| First\.T\)\?\]/);
        assert.match(
          second,
          /export type T = \[\(null \| undefined \| Second\.T\)\?\]/,
        );
      }
    });
    const distinctObject = {
      ...structuredClone(object),
      name,
      description: undefined,
    };
    const mixed = [
      route(
        { ...empty(), objects: [{ name, tags: [], type: distinctObject }] },
        "ObjectOwner",
      ),
      route(recursive(kind, name), "CollectionOwner"),
    ];
    await write(mixed, (root) => {
      assert.equal(mixed[0]!.queryObject!.type.name, `ObjectOwner.${name}`);
      assert.equal(mixed[1]!.queryObject!.type.name, `CollectionOwner.${name}`);
      assert.match(
        fs.readFileSync(
          path.join(root, "structures", "ObjectOwner.ts"),
          "utf8",
        ),
        /visible:\s*number/,
      );
      assert.ok(
        fs
          .readFileSync(
            path.join(root, "structures", "CollectionOwner.ts"),
            "utf8",
          )
          .includes(`export type ${name} =`),
      );
    });
  }
  const category = {
    ...structuredClone(object),
    name: "ICategory",
    description: undefined,
    recursive: true,
  };
  const categorySchema = {
    ...empty(),
    objects: [{ name: category.name, tags: [], type: category }],
  };
  const array: MetadataArrayType = {
    name: "ArrayICategory",
    value: categorySchema,
    recursive: false,
    index: null,
    nullables: [false],
  };
  const arraySchema = {
    ...empty(),
    arrays: [{ name: array.name, tags: [], type: array }],
  };
  category.properties = [
    {
      ...category.properties[0]!,
      value: arraySchema,
      key: {
        ...empty(),
        constants: [
          {
            type: "string",
            values: [
              { value: "children", tags: [], description: null, jsDocTags: [] },
            ],
          },
        ],
      },
    },
  ];
  const finiteArray = {
    ...empty(),
    arrays: [
      {
        name: "Arraynumber",
        tags: [],
        type: {
          name: "Arraynumber",
          value: number(),
          recursive: false,
          index: null,
          nullables: [false],
        },
      },
    ],
  };
  const finiteTuple = {
    ...empty(),
    tuples: [
      {
        name: "(numberundefined)",
        tags: [],
        type: {
          name: "(numberundefined)",
          elements: [{ ...number(), required: false, optional: true }],
          recursive: false,
          index: null,
          nullables: [false],
        },
      },
    ],
  };
  const tagged = recursive("array", "Tagged");
  tagged.arrays[0]!.tags = [
    [
      {
        target: "array",
        name: "MinItems<1>",
        kind: "minItems",
        value: 1,
        exclusive: true,
        validate: "$input.length >= 1",
        schema: { minItems: 1 },
      },
    ],
  ];
  const controls = [
    route(arraySchema, "CategoryOwner"),
    route(finiteArray, "FiniteArray"),
    route(finiteTuple, "FiniteTuple"),
    route(tagged, "TaggedOwner"),
  ];
  await write(controls, (root) => {
    assert.equal(controls[0]!.queryObject!.type.name, "ICategory[]");
    assert.equal(controls[1]!.queryObject!.type.name, "number[]");
    assert.equal(
      controls[2]!.queryObject!.type.name,
      "[(undefined | number)?]",
    );
    assert.equal(
      controls[3]!.queryObject!.type.name,
      "Tagged & tags.MinItems<1>",
    );
    assert.ok(
      controls[3]!.imports.some((entry) => entry.elements.includes("tags")),
    );
    assert.deepEqual(fs.readdirSync(path.join(root, "structures")).sort(), [
      "ICategory.ts",
      "Tagged.ts",
    ]);
    assert.match(
      fs.readFileSync(path.join(root, "structures", "ICategory.ts"), "utf8"),
      /children:\s*ICategory\[\]/,
    );
    assert.match(
      fs.readFileSync(path.join(root, "structures", "Tagged.ts"), "utf8"),
      /export type Tagged = Tagged\[\]/,
    );
  });
};
