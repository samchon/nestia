/**
 * Operation metadata written by hand for direct Swagger composition units.
 *
 * It describes one `@Query()` object parameter, `IFallbackQuery`, whose members
 * are all `number`; `visible` has no tag, and every other member carries the
 * JSDoc tag of its own name (`ignored` carries `@ignore`). With `baked`, the
 * parameter's JSON schema also carries the per-property schemas the transform
 * bakes, where `visible` has a `minimum` the atomic fallback cannot produce.
 */
export namespace HandWrittenMetadata {
  /**
   * Authors a fresh query-object and optional-void operation input.
   *
   * @evidence contracts/common.md#principled-implementation Explicit number properties, supplied omission tags, optional void success and the authored baked minimum one form input metadata. Every call creates fresh arrays, property records and components.
   * @evidence contracts/common.md#clear-and-simple-design One authored operation factory uses neutral scalar/constant/empty-schema factories; the baked flag controls only presence of the property schema under test.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These literal records are case input, never expected output or captured compiler artifacts. Actual SDK analyses and generation consume them unchanged.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies visible versus omission-tagged members and the exact baked/unbaked distinction. Cases retain their own literal schema expectations.
   */
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
