import { OpenApi } from "@samchon/openapi";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { INestiaConfig } from "../../INestiaConfig";
import { SecurityAnalyzer } from "../../analyses/SecurityAnalyzer";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";
import { SwaggerOperationParameterComposer } from "./SwaggerOperationParameterComposer";
import { SwaggerOperationResponseComposer } from "./SwaggerOperationResponseComposer";

export namespace SwaggerOperationComposer {
  export const compose = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    document: OpenApi.IDocument;
    schema: (metadata: Metadata) => OpenApi.IJsonSchema | undefined;
    route: ITypedHttpRoute;
  }): OpenApi.IOperation => {
    // FIND REQUEST BODY
    const body: ITypedHttpRouteParameter.IBody | undefined =
      props.route.parameters.find((param) => param.category === "body");

    // COMPOSE TAGS
    const tags: Set<string> = new Set([
      ...props.route.controller.tags,
      ...props.route.tags,
      ...SwaggerDescriptionComposer.getJsDocTexts({
        jsDocTags: props.route.jsDocTags,
        name: "tag",
      }).map((t) => t.split(" ")[0]),
    ]);
    if (tags.size) {
      props.document.tags ??= [];
      for (const t of tags)
        if (props.document.tags.find((elem) => elem.name === t) === undefined)
          props.document.tags.push({ name: t });
      for (const texts of SwaggerDescriptionComposer.getJsDocTexts({
        jsDocTags: props.route.jsDocTags,
        name: "tag",
      })) {
        const [name, ...description] = texts.split(" ");
        if (description.length)
          props.document.tags.find(
            (elem) => elem.name === name,
          )!.description ??= description.join(" ");
      }
    }

    // SECURITY
    const security: Record<string, string[]>[] = SecurityAnalyzer.merge(
      ...props.route.controller.security,
      ...props.route.security,
      ...props.route.jsDocTags
        .filter((tag) => tag.name === "security")
        .map((tag) =>
          tag.text === undefined
            ? [{}]
            : tag.text.map((text) => {
                const line: string[] = text.text
                  .split(" ")
                  .filter((s) => s.trim())
                  .filter((s) => !!s.length);
                if (line.length === 0) return {};
                return {
                  [line[0]]: line.slice(1),
                };
              }),
        )
        .flat(),
    );

    // FINALIZE
    return {
      ...SwaggerDescriptionComposer.compose({
        description: props.route.description,
        jsDocTags: props.route.jsDocTags,
        kind: "summary",
      }),
      deprecated: props.route.jsDocTags.some((tag) => tag.name === "deprecated")
        ? true
        : undefined,
      tags: Array.from(tags),
      operationId:
        props.route.operationId ??
        props.config.operationId?.({
          class: props.route.controller.class.name,
          function: props.route.name,
          method: props.route.method as "GET",
          path: props.route.path,
        }),
      parameters: props.route.parameters
        .map((p) =>
          SwaggerOperationParameterComposer.compose({
            config: props.config,
            document: props.document,
            schema: props.schema(p.metadata)!,
            parameter: p,
            jsDocTags: props.route.jsDocTags,
          }),
        )
        .flat(),
      requestBody: body
        ? SwaggerOperationParameterComposer.body({
            schema: props.schema(body.metadata)!,
            jsDocTags: props.route.jsDocTags,
            parameter: body,
          })
        : undefined,
      responses: SwaggerOperationResponseComposer.compose({
        schema: props.schema,
        route: props.route,
      }),
      security: security.length ? security : undefined,
      ...(props.route.extensions ?? {}),
    };
  };
}
