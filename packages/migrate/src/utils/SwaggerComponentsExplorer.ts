import { ISwaggerComponents } from "../module";
import { ISwaggerRouteParameter } from "../structures/ISwaggerRouteParameter";
import { ISwaggerRouteRequestBody } from "../structures/ISwaggerRouteRequestBody";
import { ISwaggerRouteResponse } from "../structures/ISwaggerRouteResponse";
import { SwaggerTypeChecker } from "./SwaggerTypeChecker";

export namespace SwaggerComponentsExplorer {
  export const getParameter =
    (components: ISwaggerComponents) =>
    (
      schema: ISwaggerRouteParameter | ISwaggerRouteParameter.IReference,
    ): ISwaggerRouteParameter | null =>
      SwaggerTypeChecker.isReference(schema) &&
      schema.$ref.startsWith("#/components/parameters/")
        ? components.parameters?.[
            schema.$ref.replace("#/components/parameters/", "")
          ] ?? null
        : (schema as ISwaggerRouteParameter);

  export const getRequestBody =
    (components: ISwaggerComponents) =>
    (
      schema: ISwaggerRouteRequestBody | ISwaggerRouteRequestBody.IReference,
    ): ISwaggerRouteRequestBody | null =>
      SwaggerTypeChecker.isReference(schema) &&
      schema.$ref.startsWith("#/components/requestBodies/")
        ? components.requestBodies?.[
            schema.$ref.replace("#/components/requestBodies/", "")
          ] ?? null
        : (schema as ISwaggerRouteRequestBody);

  export const getResponse =
    (components: ISwaggerComponents) =>
    (
      schema: ISwaggerRouteResponse | ISwaggerRouteResponse.IReference,
    ): ISwaggerRouteResponse | null =>
      SwaggerTypeChecker.isReference(schema) &&
      schema.$ref.startsWith("#/components/responses/")
        ? components.responses?.[
            schema.$ref.replace("#/components/responses/", "")
          ] ?? null
        : (schema as ISwaggerRouteResponse);
}
