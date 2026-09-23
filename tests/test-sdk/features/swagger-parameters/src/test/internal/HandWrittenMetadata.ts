/**
 * Operation metadata written by hand, for tests that compose Swagger at runtime
 * with `NestiaSwaggerComposer` while compiled without the SDK transform.
 *
 * It describes one `@Query()` object parameter, `IFallbackQuery`, whose members
 * are all `number`; `visible` has no tag, and every other member carries the
 * JSDoc tag of its own name (`ignored` carries `@ignore`). With `baked`, the
 * parameter's JSON schema also carries the per-property schemas the transform
 * bakes, where `visible` has a `minimum` the atomic fallback cannot produce.
 */
export namespace HandWrittenMetadata {
  export const operation = (props: { baked: boolean; members: string[] }) => ({
    parameters: [
      {
        name: "query",
        index: 0,
        description: null,
        jsDocTags: [],
        type: { name: "IFallbackQuery" },
        imports: [],
        primitive: pipe(props),
        resolved: pipe(props),
      },
    ],
    success: {
      type: { name: "void" },
      imports: [],
      primitive: nothing(),
      resolved: nothing(),
    },
    exceptions: [],
    description: null,
    jsDocTags: [],
  });

  const pipe = (props: { baked: boolean; members: string[] }) => ({
    success: true,
    data: {
      components: {
        objects: [
          {
            name: "IFallbackQuery",
            properties: ["visible", ...props.members].map((key) => ({
              key: constant(key),
              value: atomic("number"),
              description: null,
              jsDocTags:
                key === "visible"
                  ? []
                  : [{ name: key === "ignored" ? "ignore" : key, text: [] }],
              mutability: null,
            })),
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
          ...(props.baked
            ? { properties: { visible: { type: "number", minimum: 1 } } }
            : {}),
        },
      },
    },
  });

  const nothing = () => ({
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
}
