import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module, Query } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { OpenApi } from "typia";

import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("fallback")
class FallbackController {
  @core.TypedRoute.Get("baked")
  public baked(@Query() query: object): void {
    query;
  }

  @core.TypedRoute.Get("unbaked")
  public unbaked(@Query() query: object): void {
    query;
  }
}

@Module({ controllers: [FallbackController] })
class FallbackModule {}

/**
 * Verifies a decomposed parameter takes the baked property schema, and that
 * only metadata without one falls back, still honoring typia's omissions.
 *
 * The SDK transform bakes `jsonSchema.properties` for every parameter object,
 * so the JS fallback that reads only the atomic kind is left for metadata the
 * transform did not bake. On that path nothing filters for typia, so the
 * composer must itself skip what typia's object schema omits: `@internal`
 * joined `@hidden` and `@ignore` there (#1639). The metadata is registered by
 * hand, because these tests are compiled without the SDK transform, and because
 * the formatter would rewrite a `@hidden` tag in a source file.
 *
 * 1. Register one query object's metadata on two routes: one baked with a property
 *    schema that differs from the fallback's, one without the bake.
 * 2. Compose the document at runtime with `NestiaSwaggerComposer`.
 * 3. Assert the baked route uses the baked schema, and the unbaked route falls
 *    back to the atomic schema while omitting the `@internal`, `@hidden`, and
 *    `@ignore` properties on both.
 */
export const test_swagger_decomposed_fallback = async (): Promise<void> => {
  for (const [method, baked] of [
    ["baked", true],
    ["unbaked", false],
  ] as const)
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      operation(baked),
      FallbackController.prototype,
      method,
    );

  const app: INestApplication = await NestFactory.create(FallbackModule, {
    logger: false,
  });
  try {
    const document = (await NestiaSwaggerComposer.document(
      app,
      {},
    )) as OpenApi.IDocument;
    for (const [path, schema] of [
      ["/fallback/baked", { type: "number", minimum: 1 }],
      ["/fallback/unbaked", { type: "number" }],
    ] as const) {
      const parameters: SwaggerParameterReader.IParameter[] =
        SwaggerParameterReader.parameters(document, path, "get");
      TestValidator.equals(
        `${path} names`,
        parameters.map((p) => p.name),
        ["visible"],
      );
      TestValidator.equals(
        `${path} schema`,
        SwaggerParameterReader.canonical(parameters[0]?.schema),
        SwaggerParameterReader.canonical(schema),
      );
    }
  } finally {
    await app.close();
  }
};

const operation = (baked: boolean) => ({
  parameters: [
    {
      name: "query",
      index: 0,
      description: null,
      jsDocTags: [],
      type: { name: "IFallbackQuery" },
      imports: [],
      primitive: pipe(baked),
      resolved: pipe(baked),
    },
  ],
  success: {
    type: { name: "void" },
    imports: [],
    primitive: void_(),
    resolved: void_(),
  },
  exceptions: [],
  description: null,
  jsDocTags: [],
});

const pipe = (baked: boolean) => ({
  success: true,
  data: {
    components: {
      objects: [
        {
          name: "IFallbackQuery",
          properties: ["visible", "internal", "hidden", "ignored"].map(
            (key) => ({
              key: constant(key),
              value: atomic("number"),
              description: null,
              jsDocTags:
                key === "visible"
                  ? []
                  : [{ name: key === "ignored" ? "ignore" : key, text: [] }],
              mutability: null,
            }),
          ),
          description: null,
          jsDocTags: [],
          index: 0,
          recursive: false,
          nullables: [false],
        },
      ],
      aliases: [],
      arrays: [],
      tuples: [],
    },
    metadata: {
      ...schema(),
      objects: [{ name: "IFallbackQuery", tags: [] }],
      size: 1,
      name: "IFallbackQuery",
      empty: false,
      jsonSchema: {
        version: "3.1",
        components: {
          schemas: {
            IFallbackQuery: {
              type: "object",
              properties: { visible: { type: "number", minimum: 1 } },
              required: ["visible"],
            },
          },
        },
        schema: { $ref: "#/components/schemas/IFallbackQuery" },
        ...(baked
          ? { properties: { visible: { type: "number", minimum: 1 } } }
          : {}),
      },
    },
  },
});

const void_ = () => ({
  success: true,
  data: {
    components: { objects: [], aliases: [], arrays: [], tuples: [] },
    metadata: { ...schema(), required: false, optional: true, size: 0 },
  },
});

const constant = (value: string) => ({
  ...schema(),
  constants: [
    {
      type: "string",
      values: [{ value, tags: [], description: null, jsDocTags: [] }],
    },
  ],
});

const atomic = (type: string) => ({
  ...schema(),
  atomics: [{ type, tags: [] }],
});

const schema = () => ({
  any: false,
  required: true,
  optional: false,
  nullable: false,
  functions: [],
  atomics: [],
  constants: [],
  templates: [],
  escaped: null,
  rest: null,
  arrays: [],
  tuples: [],
  objects: [],
  aliases: [],
  natives: [],
  sets: [],
  maps: [],
});
