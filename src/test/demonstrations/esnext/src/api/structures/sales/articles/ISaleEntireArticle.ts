import { ISaleAnswer } from "./ISaleAnswer";
import { ISaleQuestion } from "./ISaleQuestion";
import { ISaleReview } from "./ISaleReview";

export type ISaleEntireArtcle 
    = ISaleQuestion 
    | ISaleReview;
export namespace ISaleEntireArtcle
{
    export type ISummary 
        = ISaleQuestion.ISummary 
        | ISaleReview.ISummary;

    export type IRequest
        = ISaleQuestion.IRequest
        | ISaleReview.IRequest
        | ISaleAnswer;
}