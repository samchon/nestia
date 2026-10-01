import assert from "node:assert/strict";
import typia from "typia";

import api from "../../api";
import type { IBbsArticle } from "../../oracle/header_generic_boundary/structures/body/IBbsArticle";
import type { IGoogleDriveFile } from "../../oracle/header_generic_boundary/structures/body/IGoogleDriveFile";
import type { IGoogleDriveImageSingleUpload } from "../../oracle/header_generic_boundary/structures/body/IGoogleDriveImageSingleUpload";
import type { IGoogleTokenActivate } from "../../oracle/header_generic_boundary/structures/body/IGoogleTokenActivate";

/**
 * Verifies defaulted generic DTOs survive fresh generated request assembly.
 *
 * The ordinary body fixture has no format generic or Google token scopes, so it
 * cannot connect these original omitted type arguments to actual requests.
 *
 * 1. Store the original default-string article and update its partial format.
 * 2. Activate the original literal token with default string-array scopes and call
 *    the original image-upload route using an independent authored DTO.
 * 3. Reject adjacent invalid format/token inputs and repeat valid requests.
 *
 * @evidence contracts/testing.md#behavioral-verification Fresh generated store/update/activate/single clients must accept the copied original defaulted signatures. Store echoes submitted content and passes the authored article validator; update/activate return void, and upload passes the independent source file validator. Non-string format and wrong token literal reject400 before valid recovery.
 * @evidence contracts/testing.md#independent-expectations Original IBbsArticle/IStore defaults Format to string, IUpdate is Partial<IStore>, and IGoogleTokenActivate defaults Scopes to string[] while Value is google-auth. Literal request values and copied source DTO validators establish expected payloads independently of generated clones.
 * @evidence contracts/testing.md#distinguishing-cases Full defaulted store contrasts partial/empty update; literal google-auth with string-array scopes contrasts another literal, while format string contrasts number. The original nongeneric image route remains in the same fresh generation population, and later valid calls verify recovery.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers and awaits this sole matching export after its existing compilation. Original four controllers' handlers also enter the existing fresh All-generated E2E population; native units separately own exact naming/default analysis.
 * @evidence contracts/e2e.md#necessary-boundary Installed native generic analysis, generated parameter types and actual TypedBody decoding must connect. Pure MetadataFactory or writer tests cannot establish accepted and rejected generated requests.
 * @evidence contracts/e2e.md#shared-execution Original routes join the existing rich input and All generation, single consumer compilation and shared Express/Fastify sessions; no additional installation, compiler, generator or host starts.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A dedicated route prefix prevents other body/Google handlers supplying results. Requests own local specimens and stateless controllers; all responses settle before the common owner closes the backend.
 * @evidence contracts/e2e.md#preserved-coverage Original body-generic-default's four signatures and six DTO declarations are copied with only route-prefix/import retargeting, retaining fresh generated callers. Independent literal/shape/rejection/recovery assertions supplement the original generated population; execution is pending.
 */
export const test_header_generic_boundary_defaults = async (
  connection: api.IConnection,
): Promise<void> => {
  const body = api.functional.header_generic_boundary.generic.body;
  const google =
    api.functional.header_generic_boundary.generic.google.drives.images.upload;
  const input: IBbsArticle.IStore = {
    title: "default generic article",
    body: "authored body",
    format: "markdown",
    files: [],
  };
  const token: IGoogleTokenActivate<"google-auth"> = {
    value: "google-auth",
    scopes: ["drive.read", "drive.write"],
  };
  const failures: Error[] = [];
  const check = async (
    name: string,
    operation: () => Promise<void>,
  ): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      failures.push(new Error(name, { cause: error }));
    }
  };
  const store = async (): Promise<void> => {
    const output: IBbsArticle = await body.store(connection, input);
    typia.assertEquals<IBbsArticle>(output);
    assert.deepEqual(
      {
        title: output.title,
        body: output.body,
        format: output.format,
        files: output.files,
      },
      input,
    );
  };
  await check("default article store", store);
  await check("partial and empty default article update", async () => {
    const partial: IBbsArticle.IUpdate = { format: "html" };
    assert.equal(
      await body.update(
        connection,
        "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69",
        partial,
      ),
      undefined,
    );
    assert.equal(
      await body.update(connection, "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69", {}),
      undefined,
    );
  });
  await check("literal token with default scopes", async () => {
    assert.equal(
      await google.activate(connection, "account", token),
      undefined,
    );
  });
  await check("original image upload population", async () => {
    const upload = typia.random<IGoogleDriveImageSingleUpload>();
    const file: IGoogleDriveFile = await google.single(
      connection,
      "account",
      upload,
    );
    typia.assertEquals<IGoogleDriveFile>(file);
  });
  for (const [route, payload] of [
    ["body", { ...input, format: 17 }],
    [
      "google/account/drives/images/upload/activate",
      { ...token, value: "other-auth" },
    ],
  ] as const) {
    await check(`invalid ${route}`, async () => {
      const response = await fetch(
        `${connection.host}/header_generic_boundary/generic/${route}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      await response.text();
      assert.equal(response.status, 400);
    });
  }
  await check("default article recovery", store);
  await check("literal token recovery", async () => {
    assert.equal(
      await google.activate(connection, "account", token),
      undefined,
    );
  });
  assert.deepEqual(token, {
    value: "google-auth",
    scopes: ["drive.read", "drive.write"],
  });
  if (failures.length)
    throw new AggregateError(failures, "Default generic request assembly");
};
