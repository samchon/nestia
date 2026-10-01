import { tags } from "typia";

import { IPage } from "./IPage";

export interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<80>;
  body: IArticle.Content;
  status: IArticle.Status;
  author: IArticle.IAuthor;
  labels: string[];
  metrics: Record<string, number>;
  attachments?: IArticle.IAttachment[];
  created_at: string & tags.Format<"date-time">;
  published_at: (string & tags.Format<"date-time">) | null;
}

export namespace IArticle {
  export type Status = "draft" | "review" | "published" | "archived";

  export interface IAuthor {
    id: string & tags.Format<"uuid">;
    name: string;
    email: string & tags.Format<"email">;
  }

  export type Content = ITextContent | IMarkdownContent | IExternalContent;

  export interface ITextContent {
    type: "text";
    text: string;
  }

  export interface IMarkdownContent {
    type: "markdown";
    markdown: string;
    toc: boolean;
  }

  export interface IExternalContent {
    type: "external";
    url: string & tags.Format<"uri">;
    checksum?: string;
  }

  export interface IAttachment {
    name: string;
    url: string & tags.Format<"uri">;
    content_type: "image/png" | "image/jpeg" | "application/pdf";
    size: number & tags.Type<"uint32">;
  }

  export interface ISummary {
    id: string & tags.Format<"uuid">;
    title: string;
    status: Status;
    labels: string[];
  }

  export interface ISearch extends IPage.IRequest {
    status?: Status[];
    author_id?: string & tags.Format<"uuid">;
    since?: string & tags.Format<"date">;
  }

  export interface ICreate {
    title: string & tags.MinLength<3> & tags.MaxLength<80>;
    body: Content;
    labels?: string[];
    attachments?: IAttachment[];
  }

  export interface IUpdate {
    title?: string & tags.MinLength<3> & tags.MaxLength<80>;
    body?: Content;
    labels?: string[];
    status?: Exclude<Status, "archived">;
  }
}
