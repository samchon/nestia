import type { OpenApi } from "./OpenApi";

export namespace PartialOpenApi {
  export namespace IDocument {
    /**
     * Make all properties in T optional
     */
    export type IInfo = {
      /**
       * The title of the API.
       */
      title?: undefined | string;

      /**
       * A short summary of the API.
       */
      summary?: undefined | string;

      /**
       * A full description of the API.
       */
      description?: undefined | string;

      /**
       * A URL to the Terms of Service for the API.
       */
      termsOfService?: undefined | string;

      /**
       * The contact information for the exposed API.
       */
      contact?: undefined | OpenApi.IDocument.IContact;

      /**
       * The license information for the exposed API.
       */
      license?: undefined | OpenApi.IDocument.ILicense;

      /**
       * Version of the API.
       */
      version?: undefined | string;
    };
  }
}
