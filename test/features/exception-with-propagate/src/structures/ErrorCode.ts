export namespace ErrorCode {
    export namespace Permission {
        export type Required = "REQUIRED_PERMISSION";
        export type Insufficient = "INSUFFICIENT_PERMISSION";
        export type Expired = "EXPIRED_PERMISSION";
        export type Invalid = "INVALID_PERMISSION";
    }
    export namespace Article {
        export type NotFound = "NOT_FOUND_ARTICLE";
    }
}
