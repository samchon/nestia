export namespace IBbsArticle {
    export interface ISummary {
        /**
         * @format uuid
         */
        id: string;

        writer: string;

        /**
         * @minLength 3
         * @maxLength 50
         */
        title: string;

        /**
         * @format date-time
         */
        created_at: string;
    }
}
