/**
 * Operation metadata written by hand, for tests that compose Swagger at runtime
 * through direct reflection, typed-route and generator calls without a host.
 *
 * It describes one `@Query()` object parameter, `IFallbackQuery`, whose members
 * are all `number`; `visible` has no tag, and every other member carries the
 * JSDoc tag of its own name (`ignored` carries `@ignore`). With `baked`, the
 * parameter's JSON schema also carries the per-property schemas the transform
 * bakes, where `visible` has a `minimum` the atomic fallback cannot produce.
 *
 * @evidence contracts/common.md#principled-implementation The factories describe primitive/resolved query metadata and void success without relying on the native producer or composer output.
 * @evidence contracts/common.md#clear-and-simple-design Shared schema defaults and specialized key, atomic, query and void factories keep authored meanings together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The namespace groups maintained declarations and adds no expected-output behavior or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Independent authored operation metadata with baked-property and omission-tag controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; individual functions own their processing algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained history, handles or running tasks.
 */
export namespace HandWrittenMetadata {
  /**
   * Creates one authored query operation and a void success response.
   *
   * @evidence contracts/common.md#principled-implementation Independent primitive and resolved pipes describe the same authored query and a void response without invoking the native producer.
   * @evidence contracts/common.md#clear-and-simple-design One operation factory exposes baked-property and member-tag controls to its callers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored input data is supplied to real analysis owners; no producer or composer method is replaced.
   * @evidence contracts/common.md#meaningful-documentation Creates one authored query operation and a void success response.
   * @evidence contracts/performance.md#efficient-algorithms Member construction scales linearly with the supplied member count, and each call returns independent metadata.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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

  /**
   * Builds the object schema, components and optional baked-property schema for
   * one query parameter.
   */
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

  /** Creates metadata for a void return with no component definitions. */
  const nothing = () => ({
    success: true,
    data: {
      components: { objects: [], aliases: [], arrays: [], tuples: [] },
      metadata: { ...schema(), required: false, optional: true, size: 0 },
    },
  });

  /** Creates one authored string-key constant. */
  const constant = (value: string) => ({
    ...schema(),
    constants: [
      {
        type: "string",
        values: [{ value, tags: [], description: null, jsDocTags: [] }],
      },
    ],
  });

  /** Creates one authored atomic kind without tags. */
  const atomic = (type: string) => ({
    ...schema(),
    atomics: [{ type, tags: [] }],
  });

  /** Creates fresh empty metadata with a required non-nullable default. */
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
