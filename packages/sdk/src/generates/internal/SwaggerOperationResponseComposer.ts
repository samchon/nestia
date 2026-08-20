import { OpenApi } from "@typia/interface";
import { VariadicSingleton } from "tstl";

import { MetadataSchema } from "../../internal/legacy";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { StringUtil } from "../../utils/StringUtil";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";

export namespace SwaggerOperationResponseComposer {
  export const compose = (props: {
    schema: (metadata: MetadataSchema) => OpenApi.IJsonSchema | undefined;
    route: ITypedHttpRoute;
  }): Record<string, OpenApi.IOperation.IResponse> => {
    const output: Record<string, OpenApi.IOperation.IResponse> = {};
    // FROM DECORATOR
    for (const [status, error] of Object.entries(props.route.exceptions))
      output[status] = {
        description: error.description ?? undefined,
        content: composeContent({
          contentType: "application/json",
          schema: props.schema(error.metadata),
          example: error.example,
          examples: error.examples,
        }),
      };

    // FROM COMMENTS
    for (const tag of props.route.jsDocTags) {
      if (tag.name !== "throw" && tag.name !== "throws") continue;
      const text: string | undefined = tag.text?.find(
        (elem) => elem.kind === "text",
      )?.text;
      if (text === undefined) continue;

      const elements: string[] = text.split(" ").map((str) => str.trim());
      const status: string = elements[0]!;
      if (
        isNaN(Number(status)) &&
        status !== "2XX" &&
        status !== "3XX" &&
        status !== "4XX" &&
        status !== "5XX"
      )
        continue;

      const description: string | undefined =
        elements.length === 1 ? undefined : elements.slice(1).join(" ");
      const oldbie = output[status];
      if (description && oldbie !== undefined)
        oldbie.description ??= description;
      else if (oldbie === undefined)
        output[status] = {
          description: description,
          content: {
            "application/json": {
              schema: {},
            },
          },
        };
    }

    // SUCCESS
    const description: string | undefined =
      SwaggerDescriptionComposer.descriptionFromJsDocTag({
        jsDocTags: props.route.jsDocTags,
        tag: "returns",
      }) ??
      SwaggerDescriptionComposer.descriptionFromJsDocTag({
        jsDocTags: props.route.jsDocTags,
        tag: "return",
      });
    output[
      props.route.success.status ??
        (props.route.method.toLowerCase() === "post" ? 201 : 200)
    ] = {
      description: props.route.success.encrypted
        ? `${warning.get(!!description, props.route.method)}${description ?? ""}`
        : (description ?? ""),
      content: composeContent({
        contentType: props.route.success.contentType,
        schema: props.route.success.binary
          ? {
              format: "binary",
              type: "string",
            }
          : props.schema(props.route.success.metadata),
        example: props.route.success.example,
        examples: props.route.success.examples,
      }),
      ...(props.route.success.encrypted ? { "x-nestia-encrypted": true } : {}),
    };
    return output;
  };
}

/**
 * Compose a response's `content`, or omit it when the response has no body.
 *
 * `content` describes a response body, so it exists exactly when there is one
 * to describe. A response whose metadata yields no schema -- a `void` return
 * type, or a `@TypedException<void>` declaring a status that carries no payload
 * -- has nothing to put under the media type, and writing the media type anyway
 * says "this endpoint replies with JSON" and then declines to say what the JSON
 * is: a client generator emits a parse for a body that never arrives, and the
 * Swagger 2.0 downgrade refuses the whole document because a schemaless
 * `produces` entry carries no information at all.
 *
 * Every response this composer emits goes through here, because the success
 * response and a declared exception reach the same media type by the same route
 * and a rule applied to only one of them leaves the other producing the
 * document the other case was fixed for.
 *
 * The test is what the metadata yields, not how the return type is spelled:
 * `void`, `undefined` and `never` all describe the same absent body. An example
 * without a schema still describes a body, so it keeps the entry, and so does
 * the `{}` schema the `@throws` tag path supplies for an unspecified payload.
 */
const composeContent = (props: {
  contentType: string | null | undefined;
  schema: OpenApi.IJsonSchema | undefined;
  example: any;
  examples: Record<string, any> | undefined;
}): OpenApi.IOperation.IContent | undefined => {
  if (!props.contentType) return undefined;
  const described: boolean =
    props.schema !== undefined ||
    props.example !== undefined ||
    Object.keys(props.examples ?? {}).length !== 0;
  if (described === false) return undefined;
  return {
    [props.contentType]: {
      schema: props.schema,
      example: props.example,
      examples: props.examples,
    },
  };
};

const warning = new VariadicSingleton((described: boolean, method: string) => {
  const summary: string = "Response data have been encrypted.";
  const component: string = `[EncryptedRoute.${StringUtil.capitalize(method)}](https://github.com/samchon/@nestia/core#encryptedroute)`;

  const content: string[] = [
    "## Warning",
    "",
    summary,
    "",
    `The response body data would be encrypted as "AES-128(256) / CBC mode / PKCS#5 Padding / Base64 Encoding", through the ${component} component.`,
    "",
    `Therefore, just utilize this swagger editor only for referencing. If you need to call the real API, using [SDK](https://github.com/samchon/nestia#software-development-kit) would be much better.`,
  ];
  if (described === true) content.push("", "----------------", "", "");
  return content.join("\n");
});
