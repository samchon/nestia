import type { Format } from "typia/lib/tags/Format";

import type { OmitOpenApi } from "./OmitOpenApi";
import type { RecordstringOpenApi } from "./RecordstringOpenApi";
import type { Recordstringstring } from "./Recordstringstring";

export namespace OpenApi {
  export namespace IDocument {
    /** Contact information for the exposed API. */
    export type IContact = {
      /** The identifying name of the contact person/organization. */
      name?: undefined | string;

      /** The URL pointing to the contact information. */
      url?: undefined | string;

      /** The email address of the contact person/organization. */
      email?: undefined | (string & Format<"email">);
    };
    /** License information for the exposed API. */
    export type ILicense = {
      /** The license name used for the API. */
      name: string;

      /**
       * Identifier for the license used for the API.
       *
       * Example: MIT
       */
      identifier?: undefined | string;

      /** A URL to the license used for the API. */
      url?: undefined | string;
    };
    /**
     * OpenAPI tag information.
     *
     * It is possible to skip composing this structure, even if some tag names
     * are registered in the API routes ({@link OpenApi.IOperation.tags}). In
     * that case, the tag name would be displayed in Swagger-UI without
     * description.
     *
     * However, if you want to describe the tag name, you can compose this
     * structure and describe the tag name in the {@link description} property.
     */
    export type ITag = {
      /** The name of the tag. */
      name: string;

      /** An optional string describing the tag. */
      description?: undefined | string;
    };
  }
  /** The remote server that provides the API. */
  export type IServer = {
    /** A URL to the target host. */
    url: string;

    /** An optional string describing the target server. */
    description?: undefined | string;

    /**
     * A map between a variable name and its value.
     *
     * When the server {@link url} is a type of template, this property would be
     * utilized to fill the template with actual values.
     */
    variables?: undefined | RecordstringOpenApi.IServer.IVariable;
  };
  export namespace IServer {
    /** A variable for the server URL template. */
    export type IVariable = {
      /** Default value to use for substitution. */
      default: string;

      /** List of available values for the variable. */
      enum?: undefined | string[];

      /** An optional description for the server variable. */
      description?: undefined | string;
    };
  }
  export namespace ISecurityScheme {
    /** Normal API key type. */
    export type IApiKey = {
      type: "apiKey";
      in?: undefined | "header" | "query" | "cookie";
      name?: undefined | string;
      description?: undefined | string;
    };
    /** HTTP basic authentication type. */
    export type IHttpBasic = {
      type: "http";
      scheme: "basic";
      description?: undefined | string;
    };
    /** HTTP bearer authentication type. */
    export type IHttpBearer = {
      type: "http";
      scheme: "bearer";
      bearerFormat?: undefined | string;
      description?: undefined | string;
    };
    /** OAuth2 authentication type. */
    export type IOAuth2 = {
      type: "oauth2";
      flows: OpenApi.ISecurityScheme.IOAuth2.IFlowSet;
      description?: undefined | string;
    };
    export namespace IOAuth2 {
      export type IFlowSet = {
        authorizationCode?: undefined | OpenApi.ISecurityScheme.IOAuth2.IFlow;
        implicit?:
          | undefined
          | OmitOpenApi.ISecurityScheme.IOAuth2.IFlowtokenUrl;
        password?:
          | undefined
          | OmitOpenApi.ISecurityScheme.IOAuth2.IFlowauthorizationUrl;
        clientCredentials?:
          | undefined
          | OmitOpenApi.ISecurityScheme.IOAuth2.IFlowauthorizationUrl;
      };
      export type IFlow = {
        authorizationUrl?: undefined | string;
        tokenUrl?: undefined | string;
        refreshUrl?: undefined | string;
        scopes?: undefined | Recordstringstring;
      };
    }
    export type IOpenId = {
      type: "openIdConnect";
      openIdConnectUrl: string;
      description?: undefined | string;
    };
  }
}
