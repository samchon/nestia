import fs from "fs";
import { OpenApi } from "typia";

/** Reads the generated `swagger.json` of this feature. */
export namespace SwaggerParameterReader {
  const PROPERTY_FIELDS = ["title", "description", "deprecated", "readOnly"];

  export type IParameter = OpenApi.IOperation.IParameter & {
    deprecated?: boolean;
  };

  export const document = async (): Promise<OpenApi.IDocument> =>
    JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );

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

  /** JSON with sorted keys, for exact comparison in both directions. */
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
