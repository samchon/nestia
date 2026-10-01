import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import path from "path";

import type {
  MetadataObjectType,
  MetadataSchema,
} from "../../../../../packages/sdk/lib/internal/legacy";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("first")
class FirstController {
  @Get()
  public get(@Query() _query: object): void {}
}
@Controller("second")
class SecondController {
  @Get()
  public get(@Query() _query: object): void {}
}
@Controller("equivalent")
class EquivalentController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies component identity preserves semantic fields and recursive topology.
 *
 * Resolved metadata includes transient ordinals and cyclic component links.
 * Ignoring every field named type or index also discards meaningful atomic
 * discriminators and user tag values, while cutting every resolved link loses
 * nested definitions. Independently authored distinctions must survive
 * grouping.
 *
 * 1. Build three equivalent query routes with independent metadata and ordinals.
 * 2. Change one route's atomic, union, literal, tag, nested or recursive meaning.
 * 3. Assert two definitions, with the unchanged pair sharing their definition.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual routeDictionary groups authored schemas and preserves equivalent definitions while separating atomic, union, literal, tag, nested and recursive distinctions.
 * @evidence contracts/testing.md#independent-expectations Different authored property types, literal values, constraint payloads and recursive edges represent different declarations; per-component ordinals have no declaration meaning. Literal dictionary names and component identities identify both separation and equivalent reuse.
 * @evidence contracts/testing.md#distinguishing-cases Equivalent inputs with different ordinals are the positive control. Atomic, union, literal, tag type, user payload type/index, nested definitions and recursive topology differ independently; each has an unchanged third route to reject unnecessary splitting.
 * @evidence contracts/testing.md#execution-ownership The test-sdk DynamicExecutor discovers this sole matching export. It directly calls reflection and routeDictionary with authored metadata; no consumer installation, product compilation, host or process protocol is created. Clone writer and route import consequences remain in test_sdk_clone_component_name_collisions.
 */
export const test_sdk_component_structural_identity = (): void => {
  const { TypedHttpRouteAnalyzer } = require(
    path.resolve(
      process.cwd(),
      "../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer",
    ),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  const cases: Array<{
    name: string;
    configure: (value: MetadataSchema, different: boolean) => void;
  }> = [
    { name: "equivalent", configure: () => {} },
    {
      name: "atomic",
      configure: (value, different) => {
        value.atomics = [{ type: different ? "string" : "number", tags: [] }];
      },
    },
    {
      name: "union",
      configure: (value, different) => {
        value.atomics = [
          { type: "number", tags: [] },
          { type: different ? "boolean" : "string", tags: [] },
        ];
      },
    },
    {
      name: "literal",
      configure: (value, different) => {
        value.atomics = [];
        value.constants = [
          {
            type: "string",
            values: [
              {
                value: different ? "right" : "left",
                tags: [],
                description: null,
                jsDocTags: [],
              },
            ],
          },
        ];
      },
    },
    ...["tag-schema", "payload-type", "payload-index"].map((name) => ({
      name,
      configure: (value: MetadataSchema, different: boolean) => {
        value.atomics[0]!.tags = [
          [
            {
              target: "number",
              name: "Constraint",
              kind: "custom",
              value:
                name === "payload-index"
                  ? { index: different ? 2 : 1 }
                  : {
                      type:
                        different && name === "payload-type" ? "right" : "left",
                    },
              validate: "$input >= 0",
              exclusive: false,
              ...(name === "tag-schema"
                ? { schema: { type: different ? "string" : "number" } }
                : {}),
            },
          ],
        ];
      },
    })),
    {
      name: "nested",
      configure: (value, different) => {
        const primitive = structuredClone(value);
        primitive.atomics[0]!.type = different ? "string" : "number";
        value.atomics = [];
        const nested: MetadataObjectType = {
          name: "Nested",
          index: different ? 42 : 7,
          properties: [
            {
              key: HandWrittenMetadata.operation({ baked: false, members: [] })
                .parameters[0]!.resolved.data.components.objects[0]!
                .properties[0]!.key as MetadataSchema,
              value: primitive,
              description: null,
              jsDocTags: [],
              mutability: null,
            },
          ],
          jsDocTags: [],
          recursive: false,
          nullables: [false],
        };
        value.objects = [{ name: "Nested", tags: [], type: nested }];
      },
    },
    ...["recursive", "recursive-topology"].map((name) => ({
      name,
      configure: (value: MetadataSchema, different: boolean) => {
        value.atomics = [];
        const child = structuredClone(value);
        const nested: MetadataObjectType = {
          name: "Node",
          index: different ? 42 : 7,
          properties: [
            {
              key: HandWrittenMetadata.operation({ baked: false, members: [] })
                .parameters[0]!.resolved.data.components.objects[0]!
                .properties[0]!.key as MetadataSchema,
              value: child,
              description: null,
              jsDocTags: [],
              mutability: null,
            },
          ],
          jsDocTags: [],
          recursive: true,
          nullables: [false],
        };
        value.objects = [{ name: "Node", tags: [], type: nested }];
        child.objects = [{ name: "Node", tags: [], type: nested }];
        if (name === "recursive") child.nullable = different;
        else if (different) {
          const grandchild = structuredClone(value);
          const second = {
            ...nested,
            properties: [{ ...nested.properties[0]!, value: grandchild }],
          };
          child.objects = [{ name: "Node", tags: [], type: second }];
          grandchild.objects = [{ name: "Node", tags: [], type: nested }];
        }
      },
    })),
  ];
  for (const scenario of cases) {
    const routes = [
      FirstController,
      SecondController,
      EquivalentController,
    ].flatMap((controller, index) => {
      Reflect.defineMetadata(
        "nestia/OperationMetadata",
        HandWrittenMetadata.operation({ baked: false, members: [] }),
        controller.prototype,
        "get",
      );
      const routes = SwaggerCompositionHarness.routes(controller);
      const object = routes[0]!.queryObject!.metadata.objects[0]!
        .type! as MetadataObjectType;
      object.index = index * 100;
      scenario.configure(object.properties[0]!.value, index === 1);
      return routes;
    });
    const dictionary = TypedHttpRouteAnalyzer.routeDictionary(routes);
    const names = [...dictionary.objects.keys()]
      .filter((name) => name.endsWith("IFallbackQuery"))
      .sort();
    assert.deepEqual(
      names,
      scenario.name === "equivalent"
        ? ["IFallbackQuery"]
        : ["FirstController.IFallbackQuery", "SecondController.IFallbackQuery"],
      scenario.name,
    );
    assert.equal(
      routes[0]!.queryObject!.metadata.objects[0]!.type!.name,
      routes[2]!.queryObject!.metadata.objects[0]!.type!.name,
      scenario.name,
    );
  }
};
