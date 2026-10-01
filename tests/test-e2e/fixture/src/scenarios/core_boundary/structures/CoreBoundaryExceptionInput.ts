import type { tags } from "typia";

/**
 * Preserves the original exception-filter attachment input.
 *
 * @evidence contracts/common.md#principled-implementation Nullable name and extension retain their original length constraints and URL format.
 * @evidence contracts/common.md#clear-and-simple-design One interface carries the three submitted fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The independent input contract uses public typia tags rather than observed validator output.
 * @evidence contracts/common.md#meaningful-documentation Fields describe nullable names and the URI value.
 */
export interface CoreBoundaryAttachment {
  /** Nullable attachment name. */
  name: (string & tags.MinLength<1> & tags.MaxLength<255>) | null;

  /** Nullable extension without its separator. */
  extension: (string & tags.MinLength<1> & tags.MaxLength<8>) | null;

  /** Attachment URI. */
  url: string & tags.Format<"uri">;
}

/**
 * Preserves the original exception-filter article input.
 *
 * @evidence contracts/common.md#principled-implementation The required title, body and attachment array reject the original empty-object submission.
 * @evidence contracts/common.md#clear-and-simple-design One store interface reuses the attachment owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected error or controller name participates in validation.
 * @evidence contracts/common.md#meaningful-documentation Fields retain the authored article constraints.
 */
export interface CoreBoundaryArticleStore {
  /** Article title within the original bounds. */
  title: string & tags.MinLength<3> & tags.MaxLength<50>;

  /** Article text. */
  body: string;

  /** Attached file inputs. */
  files: CoreBoundaryAttachment[];
}
