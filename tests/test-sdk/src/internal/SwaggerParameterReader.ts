import { OpenApi } from "typia";

/** Reads operation parameters and canonical schemas supplied by a unit case. */
export namespace SwaggerParameterReader {
  const PROPERTY_FIELDS = ["title", "description", "deprecated", "readOnly"];

  export type IParameter = OpenApi.IOperation.IParameter & {
    deprecated?: boolean;
  };

  /**
   * Reads caller-owned Swagger data without rewriting its meaning.
   *
   * @evidence contracts/common.md#principled-implementation Looks up the caller-requested operation and rejects absence; a present operation without parameters legitimately yields an empty list.
   * @evidence contracts/common.md#clear-and-simple-design One indexed path/method lookup returns the original ordered parameter list without rewriting it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This reader neither generates expectations nor changes actual operation values; cases supply paths and independent literal constraints.
   * @evidence contracts/common.md#meaningful-documentation The error names the missing method/path, and the signature makes the caller's document and lookup keys explicit.
   */
  export const parameters = (
    document: OpenApi.IDocument,
    path: string,
    method: "get" | "post",
  ): IParameter[] => {
    const operation: OpenApi.IOperation | undefined =
      document.paths?.[path]?.[method];
    if (operation === undefined)
      throw new Error(`Swagger document has no ${method} ${path} operation.`);
    return operation.parameters ?? [];
  };

  /**
   * The schema each property of an object component gives its decomposed
   * parameter.
   *
   * Typia writes a component property as the property value's schema with the
   * property's own `title`, `description`, `deprecated`, and `readOnly` merged
   * in, plus its `x-` JSDoc extensions. A decomposed parameter carries the
   * first four in its own fields or cannot use them, so its `schema` is the
   * component property without them. Only valid for properties whose value
   * schema has no top-level annotation of its own, which holds for every DTO in
   * this feature.
   *
   * @evidence contracts/common.md#principled-implementation Requires the named component and preserves every property schema field except title, description, deprecated and readOnly, whose documented parameter placement differs.
   * @evidence contracts/common.md#clear-and-simple-design One property traversal projects only four explicitly named annotation keys, retaining original property order and schema values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The projection is a limited component-to-parameter relationship oracle, not an independent native-schema oracle. Original literal schema pins separately distinguish native constraint loss.
   * @evidence contracts/common.md#meaningful-documentation The existing comment documents the annotation projection and its precondition that value schemas carry no conflicting top-level annotations.
   */
  export const parameterSchemas = (
    document: OpenApi.IDocument,
    component: string,
  ): Record<string, OpenApi.IJsonSchema> => {
    const schema = document.components.schemas?.[component] as
      | OpenApi.IJsonSchema.IObject
      | undefined;
    if (schema === undefined)
      throw new Error(`Swagger document has no ${component} component.`);
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [
        key,
        Object.fromEntries(
          Object.entries(value).filter(
            ([field]) => PROPERTY_FIELDS.includes(field) === false,
          ),
        ) as OpenApi.IJsonSchema,
      ]),
    );
  };

  /**
   * JSON with sorted keys, for exact comparison in both directions.
   *
   * @evidence contracts/common.md#principled-implementation Sorts plain JSON object's own keys while preserving array order and member values, so both-direction comparisons ignore only object key order.
   * @evidence contracts/common.md#clear-and-simple-design A JSON replacer sorts each object's keys locally; no global state, product operation or schema derivation is involved.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonicalization neither constructs expected schemas nor normalizes away missing fields, array ordering or actual JSON values. Cases supply independent literal counterparts.
   * @evidence contracts/common.md#meaningful-documentation The headline identifies exact JSON comparison with sorted object keys; the implementation visibly retains arrays without sorting.
   */
  export const canonical = (value: unknown): string =>
    JSON.stringify(value, (_key, member) =>
      typeof member === "object" && member !== null && !Array.isArray(member)
        ? Object.fromEntries(
            Object.keys(member)
              .sort()
              .map((key) => [key, member[key]]),
          )
        : member,
    );
}
