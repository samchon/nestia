export interface IBbsArticle {
  id: string;
  title: string;
  body: string;
  children: IBbsArticle[];
}
