import type { IBbsArticle } from "./IBbsArticle";
import type { IPage } from "./IPage";

export namespace IPageIBbsArticle {
  export type ISummary = {
    data: IBbsArticle.ISummary[];
    pagination: IPage.IPagination;
  };
}
