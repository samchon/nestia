import type { Format } from "typia/lib/tags/Format";

/**
 * Information about the API.
 * 
 * @author Samchon
 */
export type ISwaggerInfo = {
    /**
     * The title of the API.
     */
    title: string;
    /**
     * A short description of the API.
     */
    description?: undefined | string;
    /**
     * A URL to the Terms of Service for the API.
     */
    termsOfService?: undefined | (string & Format<"url">);
    /**
     * The contact information for the exposed API.
     */
    contact?: undefined | ISwaggerInfo.IContact;
    /**
     * The license information for the exposed API.
     */
    license?: undefined | ISwaggerInfo.ILicense;
    /**
     * Version of the API.
     */
    version: string;
}
export namespace ISwaggerInfo {
    /**
     * Contact information for the exposed API.
     */
    export type IContact = {
        /**
         * The identifying name of the contact person/organization.
         */
        name?: undefined | string;
        /**
         * The URL pointing to the contact information.
         */
        url?: undefined | (string & Format<"url">);
        /**
         * The email address of the contact person/organization.
         */
        email?: undefined | (string & Format<"email">);
    }
    /**
     * License information for the exposed API.
     */
    export type ILicense = {
        /**
         * The license name used for the API.
         */
        name: string;
        /**
         * A URL to the license used for the API.
         */
        url?: undefined | (string & Format<"url">);
    }
}