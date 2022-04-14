import { ISaleInquiry } from "./ISaleInquiry";

export type ISaleQuestion = ISaleInquiry<ISaleQuestion.IContent>;
export namespace ISaleQuestion
{
    export type IRequest = ISaleInquiry.IRequest;
    export type ISummary = ISaleInquiry.ISummary;
    export type IContent = ISaleInquiry.IContent;
    export type IStore = ISaleInquiry.IStore;
    export type IUpdate = ISaleInquiry.IUpdate;
}