import type { IBbsArticle } from "./IBbsArticle";
import type { IPage } from "./IPage";

export namespace IPageIBbsArticle {
    export type ISummary = {
        data: Array<IBbsArticle.ISummary>;
        pagination: IPage.IPagination;
    }
}