import type { Recordstringstring } from "./Recordstringstring";

export namespace OmitISwaggerSecurityScheme {
    export namespace IOAuth2 {
        export type IFlowtokenUrl = {
            authorizationUrl: string;
            refreshUrl: string;
            scopes?: Recordstringstring;
        }
        export type IFlowauthorizationUrl = {
            tokenUrl: string;
            refreshUrl: string;
            scopes?: Recordstringstring;
        }
    }
}