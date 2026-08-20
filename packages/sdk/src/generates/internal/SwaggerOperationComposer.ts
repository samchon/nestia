import { OpenApi } from "@typia/interface";

import { INestiaConfig } from "../../INestiaConfig";
import { SecurityAnalyzer } from "../../analyses/SecurityAnalyzer";
import { MetadataSchema } from "../../internal/legacy";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { SwaggerDescriptionComposer } from "./SwaggerDescriptionComposer";
import { SwaggerOperationParameterComposer } from "./SwaggerOperationParameterComposer";
import { SwaggerOperationResponseComposer } from "./SwaggerOperationResponseComposer";

export namespace SwaggerOperationComposer {
  export const compose = (props: {
    config: Omit<INestiaConfig.ISwaggerConfig, "output">;
    document: OpenApi.IDocument;
    schema: (metadata: MetadataSchema) => OpenApi.IJsonSchema | undefined;
    route: ITypedHttpRoute;
  }): OpenApi.IOperation => {
    // COMPOSE TAGS
    const tags: Set<string> = new Set([
      ...props.route.controller.tags,
      ...props.route.tags,
      ...SwaggerDescriptionComposer.getJsDocTexts({
        jsDocTags: props.route.jsDocTags,
        name: "tag",
      }).map((t) => t.split(" ")[0]!),
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
                  [line[0]!]: line.slice(1),
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
      parameters: [
        ...props.route.pathParameters,
        ...props.route.queryParameters,
        ...(props.route.queryObject ? [props.route.queryObject] : []),
        ...(props.route.headerObject ? [props.route.headerObject] : []),
      ]
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
      requestBody: writeRequestBody(props),
      responses: SwaggerOperationResponseComposer.compose({
        schema: props.schema,
        route: props.route,
      }),
      security: security.length ? security : undefined,
      ...(props.route.extensions ?? {}),
      "x-samchon-accessor": props.route.accessor,
      "x-samchon-controller": props.route.controller.class.name,
    };
  };
}

/**
 * Compose an operation's `requestBody`, or omit it when the body has no shape.
 *
 * `props.schema` looks the metadata up in what `SwaggerGenerator.compose`
 * collected, and that collection drops metadata of size zero -- so a `void`,
 * `undefined` or `never` body is absent from it and the lookup answers
 * `undefined`. The call site used to assert the result non-null, which turned a
 * body with nothing to describe into `content: { "application/json": {} }`: a
 * media type that says "send me JSON" and then declines to say what JSON.
 *
 * The Request Body Object's `content` is required by the specification, so the
 * honest document for such a route is not a `requestBody` with an empty
 * `content` -- it is no `requestBody`, which is also what the endpoint
 * accepts.
 *
 * Deliberately not `composeContent`, which decides the same question for
 * responses. The two rules differ and `@typia/utils`' Swagger 2.0 downgrader is
 * where that is visible: a response is described by a schema _or_ an example,
 * while a request body needs the schema -- `{ example }` alone is refused with
 * `request body examples are not representable`, with or without one. Sharing a
 * helper across two rules that disagree would trade one defect for another.
 */
const writeRequestBody = (props: {
  schema: (metadata: MetadataSchema) => OpenApi.IJsonSchema | undefined;
  route: ITypedHttpRoute;
}): OpenApi.IOperation.IRequestBody | undefined => {
  if (props.route.body === null) return undefined;
  const schema: OpenApi.IJsonSchema | undefined = props.schema(
    props.route.body.metadata,
  );
  if (schema === undefined) return undefined;
  return SwaggerOperationParameterComposer.body({
    schema,
    jsDocTags: props.route.jsDocTags,
    parameter: props.route.body,
  });
};
