import Markdown from "react-markdown";

export const MarkdownViewer = (props: MarkdownViewer.IProps) => {
  return (
    <Markdown
      components={{
        img: ({ ...props }) => (
          <img
            {...props}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
            }}
          />
        ),
      }}
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
