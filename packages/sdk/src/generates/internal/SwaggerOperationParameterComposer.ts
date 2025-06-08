import { OpenApi } from "@samchon/openapi";
import { VariadicSingleton } from "tstl";
import { IJsDocTagInfo, IJsonSchemaCollection } from "typia";
import { JsonSchemasProgrammer } from "typia/lib/programmers/json/JsonSchemasProgrammer";

import { INestiaConfig } from "../../INestiaConfig";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";

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
      required: props.parameter.metadata.isRequired(),
      ...(props.parameter.encrypted ? { "x-nestia-encrypted": true } : {}),
    };
  };

  export const path = (
    props: Omit<IProps<ITypedHttpRouteParameter.IPath>, "config" | "document">,
  ): OpenApi.IOperation.IParameter => ({
    name: props.parameter.field,
    in: "path",
    schema: props.schema,
    required: props.parameter.metadata.isRequired(),
    ...SwaggerDescriptionComposer.compose({
      description:
        props.parameter.description ??
        props.parameter.jsDocTags.find((tag) => tag.name === "description")
          ?.text?.[0].text ??
        props.jsDocTags
          .find(
            (tag) =>
              tag.name === "param" &&
              tag.text?.[0].text === props.parameter.name,
          )
          ?.text?.map((e) => e.text)
          .join("")
          .substring(props.parameter.name.length) ??
        null,
      jsDocTags: props.parameter.jsDocTags,
      kind: "title",
    }),
    example: props.parameter.example,
    examples: props.parameter.examples,
  });

  export const query = (
    props: IProps<ITypedHttpRouteParameter.IQuery>,
  ): OpenApi.IOperation.IParameter[] => decomposible(props);

  export const header = (
    props: IProps<ITypedHttpRouteParameter.IHeaders>,
  ): OpenApi.IOperation.IParameter[] => decomposible(props);

  const decomposible = (
    props: IProps<
      ITypedHttpRouteParameter.IHeaders | ITypedHttpRouteParameter.IQuery
    >,
  ): OpenApi.IOperation.IParameter[] => {
    const param: OpenApi.IOperation.IParameter = {
      name: props.parameter.field ?? props.parameter.name,
      in: props.parameter.category === "query" ? "query" : "header",
      schema: props.schema,
      ...SwaggerDescriptionComposer.compose({
        description:
          props.parameter.description ??
          props.parameter.jsDocTags.find((tag) => tag.name === "description")
            ?.text?.[0].text ??
          props.jsDocTags
            .find(
              (tag) =>
                tag.name === "param" &&
                tag.text?.[0].text === props.parameter.name,
            )
            ?.text?.map((e) => e.text)
            .join("")
            .substring(props.parameter.name.length) ??
          null,
        jsDocTags: props.jsDocTags,
        kind: "title",
      }),
      required: props.parameter.metadata.isRequired(),
      example: props.parameter.example,
      examples: props.parameter.examples,
    };
    if (
      props.config.decompose === false ||
      props.parameter.metadata.objects.length === 0
    )
      return [param];
    return props.parameter.metadata.objects[0].type.properties
      .filter((p) =>
        p.jsDocTags.every(
          (tag) => tag.name !== "hidden" && tag.name !== "ignore",
        ),
      )
      .map((p) => {
        const json: IJsonSchemaCollection = JsonSchemasProgrammer.write({
          version: "3.1",
          metadatas: [p.value],
        }) as IJsonSchemaCollection;
        if (Object.keys(json.components.schemas ?? {}).length !== 0) {
          props.document.components ??= {};
          props.document.components.schemas ??= {};
          Object.assign(
            props.document.components.schemas,
            json.components.schemas,
          );
        }
        return {
          name: p.key.constants[0].values[0].value as string,
          in: props.parameter.category === "query" ? "query" : "header",
          schema: json.schemas[0],
          required: p.value.isRequired(),
          ...SwaggerDescriptionComposer.compose({
            description: p.description ?? null,
            jsDocTags: p.jsDocTags,
            kind: "title",
          }),
        };
      });
  };
}

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
