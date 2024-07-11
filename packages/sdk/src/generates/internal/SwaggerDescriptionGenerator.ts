import { IJsDocTagInfo } from "typia";

export namespace SwaggerDescriptionGenerator {
  export const generate = <Kind extends "summary" | "title">(props: {
    description?: string;
    jsDocTags: IJsDocTagInfo[];
    kind: Kind;
  }): Kind extends "summary"
    ? { summary?: string; description?: string }
    : { title?: string; description?: string } => {
    const title: string | undefined = (() => {
      const [explicit] = getJsDocTexts({
        jsDocTags: props.jsDocTags,
        name: props.kind,
      });
      if (explicit?.length) return explicit;
      else if (props.description === undefined) return undefined;

      const index: number = props.description.indexOf("\n");
      const top: string = (
        index === -1 ? props.description : props.description.substring(0, index)
      ).trim();
      return top.endsWith(".") ? top.substring(0, top.length - 1) : undefined;
    })();
    return {
      [props.kind]: title,
      description: props.description?.length ? props.description : undefined,
    } as any;
  };

  const getJsDocTexts = (props: {
    jsDocTags: IJsDocTagInfo[];
    name: string;
  }): string[] =>
    props.jsDocTags
      .filter(
        (tag) =>
          tag.name === props.name &&
          tag.text &&
          tag.text.find((elem) => elem.kind === "text" && elem.text.length) !==
            undefined,
      )
      .map((tag) => tag.text!.find((elem) => elem.kind === "text")!.text);
}
