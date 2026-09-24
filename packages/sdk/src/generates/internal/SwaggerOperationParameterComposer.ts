import { OpenApi } from "@typia/interface";
import { OpenApiTypeChecker } from "@typia/utils";
import { VariadicSingleton } from "tstl";
import { IJsDocTagInfo, IJsonSchemaCollection } from "typia";

import { INestiaConfig } from "../../INestiaConfig";
import {
  JsonSchemasProgrammer,
  MetadataObjectType,
  MetadataProperty,
  isRequiredOf,
  isSoleLiteralOf,
} from "../../internal/legacy";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";
import { SwaggerReadonlyArrayEmender } from "./SwaggerReadonlyArrayEmender";

export namespace SwaggerOperationParameterComposer {
  export interface IProps<Parameter extends ITypedHttpRouteParameter> {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    document: OpenApi.IDocument;
    schema: OpenApi.IJsonSchema;
    jsDocTags: IJsDocTagInfo[];
    parameter: Parameter;
  }

  export const compose = (
    props: IProps<ITypedHttpRouteParameter>,
  ): OpenApi.IOperation.IParameter[] =>
    props.parameter.category === "body"
      ? []
      : props.parameter.category === "param"
        ? [path({ ...props, parameter: props.parameter })]
        : props.parameter.category === "query"
          ? query({ ...props, parameter: props.parameter })
          : header({ ...props, parameter: props.parameter });

  export const body = (
    props: IProps<ITypedHttpRouteParameter.IBody>,
  ): OpenApi.IOperation.IRequestBody | undefined => {
    const description: string | undefined =
      props.parameter.description ??
      SwaggerDescriptionComposer.descriptionFromJsDocTag({
        jsDocTags: props.jsDocTags,
        tag: "param",
        parameter: props.parameter.name,
      });
    const output: OpenApi.IOperation.IRequestBody = {
      description: props.parameter.encrypted
        ? `${warning.get(!!description)}${description ?? ""}`
        : description,
      content: {
        [props.parameter.contentType]: {
          schema: props.schema,
          example: props.parameter.example,
          examples: props.parameter.examples,
        },
      },
      required: props.parameter.metadata.required,
      ...(props.parameter.encrypted ? { "x-nestia-encrypted": true } : {}),
    };
    return props.config.openapi === "2.0"
      ? swaggerV2Body(props, output)
      : output;
  };

  /**
   * The request body a Swagger 2.0 document can hold.
   *
   * Typia's downgrader refuses what 2.0 has no place for rather than lose it,
   * so one route used to fail the whole document (#1649). A 2.0 body parameter
   * holds only a schema: no example, and no `x-nestia-encrypted` flag, whose
   * warning the description keeps. A form becomes one `formData` parameter per
   * field, which carry neither the body's description nor the form object's own
   * attributes, and are each required or not; so a form keeps only its fields,
   * is required when one of them is, and without fields has no body to list. A
   * `formData` file is one file, never an array, a union, or null, so a field
   * taking several files, or none, is listed as an optional file
   * ({@link swaggerV2FormField}).
   */
  const swaggerV2Body = (
    props: IProps<ITypedHttpRouteParameter.IBody>,
    body: OpenApi.IOperation.IRequestBody,
  ): OpenApi.IOperation.IRequestBody | undefined => {
    const contentType: string = props.parameter.contentType;
    if (
      contentType !== "multipart/form-data" &&
      contentType !== "application/x-www-form-urlencoded"
    )
      return {
        description: body.description,
        content: { [contentType]: { schema: props.schema } },
        required: body.required,
      };
    const object: OpenApi.IJsonSchema.IObject | undefined = resolveObject(
      props.document,
      props.schema,
    );
    if (
      object === undefined ||
      Object.keys(object.properties ?? {}).length === 0
    )
      return undefined;
    const fields: [string, ISwaggerV2FormField][] = Object.entries(
      object.properties ?? {},
    ).map(([key, value]) => [key, swaggerV2FormField(value)]);
    const required: string[] = (object.required ?? []).filter(
      (key) => fields.find(([name]) => name === key)?.[1].optional !== true,
    );
    return {
      content: {
        [contentType]: {
          schema: {
            type: "object",
            properties: Object.fromEntries(
              fields.map(([key, field]) => [key, field.schema]),
            ),
            required,
          },
        },
      },
      required: required.length !== 0,
    };
  };

  const path = (
    props: Omit<IProps<ITypedHttpRouteParameter.IPath>, "config" | "document">,
  ): OpenApi.IOperation.IParameter => ({
    name: props.parameter.field,
    in: "path",
    schema: props.schema,
    required: props.parameter.metadata.required,
    description: parameterDescription(props),
    example: props.parameter.example,
    examples: props.parameter.examples,
  });

  const query = (
    props: IProps<ITypedHttpRouteParameter.IQuery>,
  ): OpenApi.IOperation.IParameter[] => decomposible(props);

  const header = (
    props: IProps<ITypedHttpRouteParameter.IHeaders>,
  ): OpenApi.IOperation.IParameter[] => decomposible(props);

  const parameterDescription = (
    props: Pick<IProps<ITypedHttpRouteParameter>, "parameter" | "jsDocTags">,
  ): string | undefined => {
    return (
      props.parameter.description ??
      props.parameter.jsDocTags.find((tag) => tag.name === "description")
        ?.text?.[0]?.text ??
      props.jsDocTags
        .find(
          (tag) =>
            tag.name === "param" &&
            tag.text?.[0]?.text === props.parameter.name,
        )
        ?.text?.map((e) => e.text)
        .join("")
        .substring(props.parameter.name.length)
        .trim()
    );
  };

  const decomposible = (
    props: IProps<
      ITypedHttpRouteParameter.IHeaders | ITypedHttpRouteParameter.IQuery
    >,
  ): OpenApi.IOperation.IParameter[] => {
    const object: MetadataObjectType | undefined = props.parameter.metadata
      .objects[0]?.type as MetadataObjectType | undefined;
    const param: OpenApi.IOperation.IParameter = {
      name: props.parameter.field ?? props.parameter.name,
      in: props.parameter.category === "query" ? "query" : "header",
      schema: props.schema,
      description: parameterDescription(props),
      // An unnamed object's keys are the request's own query keys or headers,
      // so it is mandatory only when one of the keys the document describes
      // is; an object whose described properties are all optional is satisfied
      // when the request sends none of them. A field-named parameter is one
      // key, required as declared.
      required:
        props.parameter.metadata.required &&
        (props.parameter.field !== null ||
          (object?.properties.some(
            (p) => isDescribed(p) && isRequiredOf(p.value),
          ) ??
            true)),
      example: props.parameter.example,
      examples: props.parameter.examples,
    };
    // A field-named parameter is one key, which typia's HTTP rules (#1648)
    // keep atomic, and a query or headers object passed them: one object of
    // statically named atomic or array-of-atomic properties, so each has a
    // name to give its parameter.
    if (props.parameter.field !== null || object === undefined) return [param];
    // `decompose: false` keeps a query object one parameter where the format
    // can say so: OpenAPI 3.x spreads it into its keys with `style: form` and
    // `explode: true`. Swagger 2.0 has no object query parameter, and no
    // format spreads an object into headers, so one parameter would be a key
    // or header no request carries (#1653); those are always decomposed.
    if (
      props.config.decompose === false &&
      props.parameter.category === "query" &&
      props.config.openapi !== "2.0"
    )
      return [{ ...param, style: "form", explode: true }];
    // One parameter per property typia's object schema describes, so the
    // decomposed form says what `decompose: false` would say about the object:
    // the property's schema, and in the parameter's own fields its
    // description, deprecation, and share of the object's examples.
    return object.properties
      .filter(isDescribed)
      .map((p): IDecomposedParameter | null => {
        const key: string = String(p.key.constants[0]!.values[0]!.value);
        const json: IJsonSchemaCollection | null =
          JsonSchemasProgrammer.writeProperty({
            version: "3.1",
            metadata: props.parameter.metadata,
            key,
            value: p.value,
          });
        if (json === null) return null;
        SwaggerReadonlyArrayEmender.emend({
          components: json.components,
          schema: json.schemas[0],
          metadata: p.value,
        });
        // Only what the document lacks: the parameter's own schema already
        // brought every component its properties reach, emended for readonly
        // arrays, and this copy is not.
        props.document.components ??= {};
        props.document.components.schemas ??= {};
        for (const [name, schema] of Object.entries(
          json.components.schemas ?? {},
        ))
          props.document.components.schemas[name] ??= schema;
        return {
          name: key,
          in: props.parameter.category === "query" ? "query" : "header",
          schema: json.schemas[0]!,
          required: isRequiredOf(p.value),
          description: SwaggerDescriptionComposer.compose({
            description: p.description ?? null,
            jsDocTags: p.jsDocTags,
            kind: "title",
          }).description,
          // Swagger 2.0 defines no `deprecated` on a parameter, and the
          // downgrader copies the field through rather than refusing it.
          deprecated:
            props.config.openapi !== "2.0" &&
            p.jsDocTags.some((tag) => tag.name === "deprecated")
              ? true
              : undefined,
          example: memberOf(props.parameter.example, key),
          examples: membersOf(props.parameter.examples, key),
        };
      })
      .filter((p): p is IDecomposedParameter => p !== null);
  };
}

/**
 * A decomposed parameter. OpenAPI 3.0 through 3.2 define `deprecated` on the
 * Parameter Object, which typia's `OpenApi.IOperation.IParameter` does not
 * model; its 3.x downgraders carry the field through unchanged.
 */
type IDecomposedParameter = OpenApi.IOperation.IParameter & {
  deprecated?: boolean;
};

/**
 * Whether the document can describe a property on its own: it has a literal key
 * to name it, and none of the `@hidden`, `@ignore`, and `@internal` tags
 * typia's object schema drops it for.
 */
const isDescribed = (p: MetadataProperty): boolean =>
  isSoleLiteralOf(p.key) &&
  p.jsDocTags.every(
    (tag) =>
      tag.name !== "hidden" && tag.name !== "ignore" && tag.name !== "internal",
  );

/** A form field as a Swagger 2.0 `formData` parameter holds it. */
interface ISwaggerV2FormField {
  schema: OpenApi.IJsonSchema;

  /** Whether a request may leave the field out though its type requires it. */
  optional: boolean;
}

/**
 * A form field as a Swagger 2.0 `formData` parameter can hold it.
 *
 * A 2.0 file is one file: never an array, a union, or null. A field whose value
 * is made of files, a union of files or one of them or null, or an array of
 * those, becomes the one file a request may carry, keeping the field's title,
 * description, and deprecation. A request may then carry none, since the server
 * reads a missing field as null or an empty array, so such a field is not
 * required; a plain file is kept as it is.
 */
const swaggerV2FormField = (
  schema: OpenApi.IJsonSchema,
): ISwaggerV2FormField => {
  const file: IFileOf | undefined = fileOf(schema, true);
  if (file === undefined || file.binary === schema)
    return { schema, optional: false };
  const attributes = schema as OpenApi.IJsonSchema.IString;
  return {
    schema: {
      ...file.binary,
      ...(attributes.title !== undefined ? { title: attributes.title } : {}),
      ...(attributes.description !== undefined
        ? { description: attributes.description }
        : {}),
      ...(attributes.deprecated !== undefined
        ? { deprecated: attributes.deprecated }
        : {}),
    },
    optional: file.optional,
  };
};

interface IFileOf {
  binary: OpenApi.IJsonSchema;
  optional: boolean;
}

/** The file a field's value is made of, if it is made of files only. */
const fileOf = (
  schema: OpenApi.IJsonSchema,
  top: boolean,
): IFileOf | undefined => {
  if (isBinary(schema)) return { binary: schema, optional: false };
  if (OpenApiTypeChecker.isOneOf(schema)) {
    const members: OpenApi.IJsonSchema[] = schema.oneOf.filter(
      (s) => OpenApiTypeChecker.isNull(s) === false,
    );
    const files: Array<IFileOf | undefined> = members.map((s) =>
      fileOf(s, top),
    );
    if (files.length === 0 || files.some((f) => f === undefined))
      return undefined;
    return {
      binary: files[0]!.binary,
      optional:
        members.length !== schema.oneOf.length ||
        files.some((f) => f!.optional),
    };
  }
  if (top && OpenApiTypeChecker.isArray(schema)) {
    const item: IFileOf | undefined = fileOf(schema.items, false);
    return item === undefined
      ? undefined
      : { binary: item.binary, optional: true };
  }
  return undefined;
};

const isBinary = (schema: OpenApi.IJsonSchema): boolean =>
  OpenApiTypeChecker.isString(schema) && schema.format === "binary";

/** The object schema `schema` is or refers to, if it is one. */
const resolveObject = (
  document: OpenApi.IDocument,
  schema: OpenApi.IJsonSchema,
): OpenApi.IJsonSchema.IObject | undefined => {
  const visited: Set<string> = new Set();
  while (OpenApiTypeChecker.isReference(schema)) {
    if (visited.has(schema.$ref)) return undefined;
    visited.add(schema.$ref);
    const next: OpenApi.IJsonSchema | undefined =
      document.components?.schemas?.[
        schema.$ref.substring("#/components/schemas/".length)
      ];
    if (next === undefined) return undefined;
    schema = next;
  }
  return OpenApiTypeChecker.isObject(schema) ? schema : undefined;
};

/** The `key` member of an object example, if the example has one. */
const memberOf = (example: unknown, key: string): unknown =>
  typeof example === "object" &&
  example !== null &&
  Object.prototype.hasOwnProperty.call(example, key)
    ? (example as Record<string, unknown>)[key]
    : undefined;

/**
 * Named object examples narrowed to the ones whose value has a `key` member,
 * each an Example Object of that member.
 */
const membersOf = (
  examples: Record<string, OpenApi.IExample> | undefined,
  key: string,
): Record<string, OpenApi.IExample> | undefined => {
  if (examples === undefined) return undefined;
  const entries: [string, OpenApi.IExample][] = Object.entries(examples)
    .map(([name, example]): [string, OpenApi.IExample] => [
      name,
      { ...example, value: memberOf(example.value, key) },
    ])
    .filter(([, example]) => example.value !== undefined);
  return entries.length !== 0 ? Object.fromEntries(entries) : undefined;
};

const warning = new VariadicSingleton((described: boolean): string => {
  const summary = "Request body must be encrypted.";
  const component =
    "[EncryptedBody](https://github.com/samchon/@nestia/core#encryptedbody)";
  const content: string[] = [
    "## Warning",
    "",
    summary,
    "",
    `The request body data would be encrypted as "AES-128(256) / CBC mode / PKCS#5 Padding / Base64 Encoding", through the ${component} component.`,
    "",
    `Therefore, just utilize this swagger editor only for referencing. If you need to call the real API, using [SDK](https://github.com/samchon/nestia#software-development-kit) would be much better.`,
  ];
  if (described === true) content.push("", "----------------", "", "");
  return content.join("\n");
});
