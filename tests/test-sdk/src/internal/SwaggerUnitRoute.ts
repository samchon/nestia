import { ITypedHttpRoute } from "../../../../packages/sdk/lib/structures/ITypedHttpRoute";

/**
 * Authors an empty GET route for direct Swagger composition units.
 *
 * Documentation decisions need a valid analyzed-route input but no compiler or
 * application. Each call owns its controller record and mutable collections.
 *
 * @evidence contracts/common.md#principled-implementation The route represents an authored GET with no parameters, void success and no documentation/security defaults. Complete empty metadata follows the owning interface rather than reusing generated output as an expectation.
 * @evidence contracts/common.md#clear-and-simple-design One factory supplies the neutral input whose individual documentation fields a case changes; each case keeps its own expected operation values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is authored test input, not substituted product output or a patched analyzer. Units call the actual built composer with this input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the input's meaning and per-call ownership so cases cannot share mutable route state accidentally.
 */
export const SwaggerUnitRoute = (): ITypedHttpRoute => ({
  protocol: "http",
  function: () => undefined,
  controller: {
    class: class UnitSwaggerController {},
    prefixes: [],
    paths: ["unit"],
    file: "authored-controller.ts",
    versions: undefined,
    operations: [],
    security: [],
    tags: [],
  },
  key: "get",
  name: "get",
  method: "GET",
  path: "/unit",
  accessor: ["unit", "get"],
  pathParameters: [],
  queryParameters: [],
  headerParameters: [],
  queryObject: null,
  headerObject: null,
  body: null,
  success: {
    type: { name: "void" },
    status: 200,
    contentType: "application/json",
    binary: false,
    encrypted: false,
    metadata: {
      any: false,
      required: false,
      optional: true,
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
    },
    setHeaders: [],
  },
  // No exception was authored. Runtime route maps legitimately omit every
  // status even though Record's wildcard keys are statically required.
  exceptions: {} as ITypedHttpRoute["exceptions"],
  security: [],
  tags: [],
  imports: [],
  description: null,
  jsDocTags: [],
  operationId: undefined,
});
