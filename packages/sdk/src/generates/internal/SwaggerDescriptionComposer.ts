import { IJsDocTagInfo } from "typia";

/**
 * Composes the title or summary and the description of a document member from
 * its comment.
 *
 * @evidence contracts/common.md#principled-implementation The namespace reads the explicit tag, and otherwise takes the first line of the description when it is a sentence.
 * @evidence contracts/common.md#clear-and-simple-design Three functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tag has priority over the derived text.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerDescriptionComposer composes OpenAPI data; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace SwaggerDescriptionComposer {
  /**
   * Returns the `summary` or `title` and the `description` of a member.
   *
   * The explicit tag is the summary; otherwise the description's first line,
   * without its final period, when that line ends with one.
   *
   * @evidence contracts/common.md#principled-implementation The derived summary is only ever a whole sentence, and a description that is not a sentence has none.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The kind is the caller's choice.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerDescriptionComposer.compose composes OpenAPI data; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the first text part of the first JSDoc tag with the name and a text
   * array, matching the parameter name when one is given. Returns undefined
   * when that selected tag has no text part.
   *
   * @evidence contracts/common.md#principled-implementation A matching tag with a text array is selected, then its first text part is returned if present.
   * @evidence contracts/common.md#clear-and-simple-design One search.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the tags.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerDescriptionComposer.descriptionFromJsDocTag composes OpenAPI data; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the text of every JSDoc tag with the name and a non-empty text.
   *
   * @evidence contracts/common.md#principled-implementation The tags are filtered, then read.
   * @evidence contracts/common.md#clear-and-simple-design One filter and one map.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty text is not returned.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SwaggerDescriptionComposer.getJsDocTexts composes OpenAPI data; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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
      .map(
        (tag) =>
          tag.text!.find((elem) => elem.kind === "text" && elem.text.length)!
            .text,
      );
}
