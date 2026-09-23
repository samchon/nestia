import { OpenApi } from "@typia/interface";
import { VariadicSingleton } from "tstl";
import { IJsDocTagInfo, IJsonSchemaCollection } from "typia";

import { INestiaConfig } from "../../INestiaConfig";
import {
  JsonSchemasProgrammer,
  MetadataObjectType,
  isRequiredOf,
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
    props: Omit<IProps<ITypedHttpRouteParameter.IBody>, "config" | "document">,
  ): OpenApi.IOperation.IRequestBody => {
    const description: string | undefined =
      props.parameter.description ??
      SwaggerDescriptionComposer.descriptionFromJsDocTag({
        jsDocTags: props.jsDocTags,
        tag: "param",
        parameter: props.parameter.name,
      });
    return {
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
    const param: OpenApi.IOperation.IParameter = {
      name: props.parameter.field ?? props.parameter.name,
      in: props.parameter.category === "query" ? "query" : "header",
      schema: props.schema,
      description: parameterDescription(props),
      required: props.parameter.metadata.required,
      example: props.parameter.example,
      examples: props.parameter.examples,
    };
    if (
      props.config.decompose === false ||
      props.parameter.metadata.objects.length === 0
    )
      return [param];
    // One parameter per property typia's object schema describes, so the
    // decomposed form says what `decompose: false` would say about the object:
    // the property's value schema, and in the parameter's own fields its
    // description, deprecation, and share of the object's examples.
    return (
      props.parameter.metadata.objects[0]!.type as MetadataObjectType
    ).properties
      .filter((p) =>
        p.jsDocTags.every(
          (tag) =>
            tag.name !== "hidden" &&
            tag.name !== "ignore" &&
            tag.name !== "internal",
        ),
      )
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
        if (Object.keys(json.components.schemas ?? {}).length !== 0) {
          props.document.components ??= {};
          props.document.components.schemas ??= {};
          Object.assign(
            props.document.components.schemas,
            json.components.schemas,
          );
        }
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
          deprecated: p.jsDocTags.some((tag) => tag.name === "deprecated")
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
 * model; its downgraders carry the field through unchanged.
 */
type IDecomposedParameter = OpenApi.IOperation.IParameter & {
  deprecated?: boolean;
};

/** The `key` member of an object example, if the example has one. */
const memberOf = (example: unknown, key: string): unknown =>
  typeof example === "object" &&
  example !== null &&
  Object.prototype.hasOwnProperty.call(example, key)
    ? (example as Record<string, unknown>)[key]
    : undefined;

/**
 * Named object examples narrowed to the ones that have a `key` member, in the
 * same representation the undecomposed parameter carries them.
 */
const membersOf = (
  examples: Record<string, any> | undefined,
  key: string,
): Record<string, any> | undefined => {
  if (examples === undefined) return undefined;
  const entries: [string, unknown][] = Object.entries(examples)
    .map(([name, value]): [string, unknown] => [name, memberOf(value, key)])
    .filter(([, value]) => value !== undefined);
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
