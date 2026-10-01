import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import os from "os";

import { createMultipartUpload } from "../../../internal/MultipartFactory";
import { IMultipartMultipartFormData } from "../structures/IMultipartMultipartFormData";

/**
 * Exposes received multipart bytes and names without hidden content predicates.
 *
 * Authored consumers independently verify their exact bytes. The handler also
 * accepts other Blob/File values permitted by the declared request contract.
 *
 * @evidence contracts/common.md#principled-implementation The installed multipart decorator supplies actual Blob/File values; handlers read those values and report their contents or disk upload text, with no fixture-specific byte or name rejection.
 * @evidence contracts/common.md#clear-and-simple-design The memory handler reports all received uploads, and the existing disk handler reports one file. Exact expected values belong to the consumer assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No generated-case exception or validator bypass is used. Every type-valid upload follows the same byte-reading path.
 * @evidence contracts/common.md#meaningful-documentation This comment explains why transport verification observes contents instead of imposing undeclared business predicates.
 * @evidence contracts/performance.md#efficient-algorithms Each received byte is read and represented once; array mapping preserves upload order with work and response storage linear in uploaded bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Only request-owned decoded uploads are consumed. Stateless handlers retain no result across requests and require no per-case backend.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Byte arrays remain owned by the current response; the TypedFormData decorator reads and removes multer disk files before passing File objects to the handler.
 * @evidence contracts/portability.md#os-neutral-implementation The disk handler passes the platform-selected os.tmpdir to multer; memory byte reads use standard Blob/File APIs and contain no filesystem assumptions.
 */
@Controller("multipart_form_data/multipart")
export class MultipartController {
  @core.TypedRoute.Post()
  /**
   * Returns scalar content and complete upload bytes for any declared input.
   *
   * @evidence contracts/common.md#principled-implementation Standard arrayBuffer reads produce byte arrays from each actual decoded upload; file names come from decoded File objects. Response serialization retains the declared content and upload observation fields.
   * @evidence contracts/common.md#clear-and-simple-design Two request-local readers distinguish Blob bytes from File bytes plus name; ordered Promise.all mapping preserves each multipart array's order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The handler neither compares against expected fixture constants nor bypasses runtime validators; independent caller assertions detect transport corruption.
   * @evidence contracts/common.md#meaningful-documentation The comment states the general accepted input domain and returned observations.
   * @evidence contracts/performance.md#efficient-algorithms Total work and allocated response space are linear in the received bytes and upload count; no cross-request data is scanned.
   * @evidence contracts/performance.md#reuse-equivalent-work Reading each request's immutable decoded upload once yields its response observation; results are not reused across different upload inputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Request-local byte arrays and readers are released with the completed response; no controller field retains them.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This handler uses standard Blob/File buffer APIs and chooses no native path or executable representation.
   */
  public async post(
    @core.TypedFormData.Body(() => createMultipartUpload())
    body: IMultipartMultipartFormData,
  ): Promise<IMultipartMultipartFormData.IContentMultipartFormData> {
    const bytes = async (blob: Blob): Promise<number[]> =>
      Array.from(new Uint8Array(await blob.arrayBuffer()));
    const file = async (
      input: File,
    ): Promise<IMultipartMultipartFormData.IFileContent> => ({
      name: input.name,
      bytes: await bytes(input),
    });
    return {
      ...body,
      uploads: {
        blob: await bytes(body.blob),
        blobs: await Promise.all(body.blobs.map(bytes)),
        file: await file(body.file),
        files: await Promise.all(body.files.map(file)),
      },
    };
  }

  @core.TypedRoute.Post("disk")
  /**
   * Multer disk storage keeps an upload in a file instead of a buffer; the
   * handler must still receive its bytes.
   *
   * @evidence contracts/common.md#principled-implementation The actual disk-backed multer upload is converted by TypedFormData into a File; this handler returns its name, byte size and text for independent consumer comparison.
   * @evidence contracts/common.md#clear-and-simple-design The disk route has one file input and one observation object, keeping the disk conversion boundary distinct from multi-upload memory storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The handler reads the decoded File through public APIs and does not synthesize known fixture contents or replace multer behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment explains the buffer-versus-disk regression and expected observable values.
   * @evidence contracts/performance.md#efficient-algorithms File.text reads one upload and produces a response proportional to its contents; the handler does not reread other uploads.
   * @evidence contracts/performance.md#reuse-equivalent-work Each response observes only its current upload; no cache or retained cross-request state can mask a changed input.
   * @evidence contracts/performance.md#bound-retention-and-release-resources TypedFormData owns disk-file read/removal before invocation, and the handler retains only response-owned strings until request completion.
   * @evidence contracts/portability.md#os-neutral-implementation Multer receives os.tmpdir rather than a platform-specific literal path; decoded File text and metadata use platform-neutral APIs.
   */
  public async disk(
    @core.TypedFormData.Body(() => createMultipartUpload({ dest: os.tmpdir() }))
    body: IMultipartMultipartFormData.IDiskMultipartFormData,
  ): Promise<IMultipartMultipartFormData.IDiskContentMultipartFormData> {
    return {
      name: body.file.name,
      size: body.file.size,
      text: await body.file.text(),
    };
  }
}
