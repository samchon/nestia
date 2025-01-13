import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkMermaidPlugin from "remark-mermaid-plugin";

export const MarkdownViewer = (props: MarkdownViewer.IProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkMermaidPlugin as any]}
      rehypePlugins={[rehypeRaw, rehypeStringify]}
    >
      {props.children}
    </Markdown>
  );
};
export namespace MarkdownViewer {
  export interface IProps {
    children: string | null | undefined;
  }
}
