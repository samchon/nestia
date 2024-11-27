import { IJsDocTagInfo } from "typia";

export namespace SwaggerDescriptionComposer {
  export const compose = <Kind extends "summary" | "title">(props: {
    description: string | null;
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
      else if (!props.description?.length) return undefined;

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

  export const descriptionFromJsDocTag = (props: {
    jsDocTags: IJsDocTagInfo[];
    tag: string;
    parameter?: string;
  }): string | undefined => {
    const parametric: (elem: IJsDocTagInfo) => boolean = props.parameter
      ? (tag) =>
          tag.text!.find(
            (elem) =>
              elem.kind === "parameterName" && elem.text === props.parameter,
          ) !== undefined
      : () => true;
    const tag: IJsDocTagInfo | undefined = props.jsDocTags.find(
      (tag) => tag.name === props.tag && tag.text && parametric(tag),
    );
    return tag && tag.text
      ? tag.text.find((elem) => elem.kind === "text")?.text
      : undefined;
  };

  export const getJsDocTexts = (props: {
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
