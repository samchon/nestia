import { ISaleInquiry } from "./ISaleInquiry";

export type ISaleReview = ISaleInquiry<ISaleReview.IContent>;
export namespace ISaleReview
{
    export type IRequest = ISaleInquiry.IRequest;

    export interface ISummary extends ISaleInquiry.ISummary
    {
        score: number;
    }

    export interface IContent extends ISaleInquiry.IContent
    {
        score: number;
    }

    export interface IStore extends ISaleInquiry.IStore
    {
        score: number;
    }

    export interface IUpdate extends ISaleInquiry.IUpdate
    {
        score: number;
    }
}