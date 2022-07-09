import { ISaleInquiry } from "./ISaleInquiry";

/**
 * Review article.
 *
 * The `ISaleReview` is a type of review article written by a consumer who've bought
 * the sale good with the estimation score.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISaleReview = ISaleInquiry<ISaleReview.IContent>;
export namespace ISaleReview {
    /**
     * Content info of the review.
     */
    export interface IContent extends ISaleInquiry.IContent {
        /**
         * Estimation score.
         */
        score: number;
    }

    /**
     * Store info of the review.
     */
    export interface IStore extends ISaleInquiry.IStore {
        /**
         * Estimation score.
         */
        score: number;
    }
}
