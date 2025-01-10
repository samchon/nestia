import {
  HttpLlm,
  IHttpLlmApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import typia, { IValidation } from "typia";

export const createHttpLlmApplication = (props: {
  model: "chatgpt";
  document:
    | SwaggerV2.IDocument
    | OpenApiV3.IDocument
    | OpenApiV3_1.IDocument
    | OpenApi.IDocument;
  options?: IHttpLlmApplication.IOptions<"chatgpt">;
}): IValidation<IHttpLlmApplication<"chatgpt">> => {
  const inspect: IValidation<
    | SwaggerV2.IDocument
    | OpenApiV3.IDocument
    | OpenApiV3_1.IDocument
    | OpenApi.IDocument
  > = typia.validate(props.document);
  if (inspect.success === false) return inspect;
  return {
    success: true,
    data: HttpLlm.application({
      model: props.model,
      document: OpenApi.convert(props.document),
      options: props.options,
    }),
  };
};
