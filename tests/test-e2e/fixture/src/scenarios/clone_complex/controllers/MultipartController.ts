import { TypedFormData, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { createMultipartUpload } from "../../../internal/MultipartFactory";

/**
 * Receives the original private native form through both shared HTTP adapters.
 *
 * The source-private eight-field DTO and void response remain unchanged; only
 * the middleware factory is composed for sequential Express and Fastify hosts.
 *
 * @evidence contracts/common.md#principled-implementation TypedFormData decodes the same private UUID, strings, number, int32 array, Blob and File fields. The existing public middleware composition dispatches by each actual request adapter and retains the original void handler.
 * @evidence contracts/common.md#clear-and-simple-design One original controller and one shared factory keep native form declaration extraction separate from adapter selection; no extra host or controller variant is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The public shared factory delegates actual multer implementations without changing foreign methods or recognizing this fixture. No DTO field, validator constraint or handler response is changed to accommodate an adapter.
 * @evidence contracts/common.md#meaningful-documentation The class comment states the maintained factory difference and preserved private form/void contract so the copy is not mistaken for an unmodified source.
 */
@Controller("clone_complex/multipart")
export class MultipartController {
  @TypedRoute.Post()
  /**
   * Accepts the original decoded form and returns no response payload.
   *
   * @evidence contracts/common.md#principled-implementation TypedFormData uses the public shared middleware factory to obtain native request files and validate the unchanged IMultipart type before this void operation receives its body.
   * @evidence contracts/common.md#clear-and-simple-design The operation keeps its original body-only signature and void response; validation and adapter dispatch belong to their existing decorators and factory.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The handler merely receives its original input and introduces no byte-echo behavior, fixture predicate, foreign patch or permissive validation branch.
   * @evidence contracts/common.md#meaningful-documentation The comment explains that successful requests have no payload and that body decoding belongs to the decorator rather than this handler.
   */
  public post(
    @TypedFormData.Body(() => createMultipartUpload()) body: IMultipart,
  ): void {
    body;
  }
}

interface IMultipart {
  id: string & tags.Format<"uuid">;
  strings: string[];
  number: number;
  integers: Array<number & tags.Type<"int32">>;
  blob: Blob;
  blobs: Blob[];
  file: File;
  files: File[];
}
