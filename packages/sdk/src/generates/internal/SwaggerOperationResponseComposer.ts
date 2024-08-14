import { OpenApi } from "@samchon/openapi";
import { VariadicSingleton } from "tstl";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { StringUtil } from "../../utils/StringUtil";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";

export namespace SwaggerOperationResponseComposer {
  export const compose = (props: {
    schema: (metadata: Metadata) => OpenApi.IJsonSchema | undefined;
    route: ITypedHttpRoute;
  }): Record<string, OpenApi.IOperation.IResponse> => {
    const output: Record<string, OpenApi.IOperation.IResponse> = {};
    // FROM DECORATOR
    for (const [status, error] of Object.entries(props.route.exceptions))
      output[status] = {
        description: error.description ?? undefined,
        content: {
          "application/json": {
            schema: props.schema(error.metadata),
            example: error.example,
            examples: error.examples,
          },
        },
      };

    // FROM COMMENTS
    for (const tag of props.route.jsDocTags) {
      if (tag.name !== "throw" && tag.name !== "throws") continue;
      const text: string | undefined = tag.text?.find(
        (elem) => elem.kind === "text",
      )?.text;
      if (text === undefined) continue;

      const elements: string[] = text.split(" ").map((str) => str.trim());
      const status: string = elements[0];
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
          description,
          content: {
            "application/json": {
              schema: {},
            },
          },
        };
    }

    // SUCESS
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
        : description,
      content: props.route.success.contentType
        ? {
            [props.route.success.contentType]: {
              schema: props.schema(props.route.success.metadata),
              example: props.route.success.example,
              examples: props.route.success.examples,
            },
          }
        : undefined,
      ...(props.route.success.encrypted ? { "x-nestia-encrypted": true } : {}),
    };
    return output;
  };
}

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
