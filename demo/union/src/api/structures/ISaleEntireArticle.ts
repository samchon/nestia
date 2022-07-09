import { ISaleQuestion } from "./ISaleQuestion";
import { ISaleReview } from "./ISaleReview";

/**
 * Union type of the entire sub-type articles.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISaleEntireArtcle = ISaleQuestion | ISaleReview;
export namespace ISaleEntireArtcle {
    /**
     * Summarized union type of the entire sub-type articles.
     */
    export type ISummary = ISaleQuestion.ISummary | ISaleReview.ISummary;

    /**
     * Page request union type of the entire sub-type articles.
     */
    export type IRequest = ISaleQuestion.IRequest | ISaleReview.IRequest;
}
