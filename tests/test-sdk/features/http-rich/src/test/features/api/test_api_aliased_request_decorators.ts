import assert from "assert/strict";
import typia from "typia";

import api from "../../../api";
import { IBbsArticle } from "../../../structures/variable/IBbsArticle";
import { IPage } from "../../../structures/variable/IPage";

/**
 * Verifies aliased decorators preserve request validation and response values
 * through the installed producer and the shared HTTP application.
 *
 * The same authored controller mixes named aliases and namespace calls. Go
 * units own configured discriminator/report selection; this connection must
 * actually reject malformed requests instead of leaving an untransformed stub.
 *
 * 1. Send valid and wrong-type bodies through the aliased body and route calls.
 * 2. Send numeric and malformed queries through the aliased query call.
 * 3. Send valid and malformed UUID paths through the aliased parameter call.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual aliased Body/Query/Param/Route controller accepts authored body, numeric query and UUID path requests, preserves stored body fields and path identity, and rejects adjacent malformed requests with HTTP400. Each successful result also satisfies the authored response DTO.
 * @evidence contracts/testing.md#independent-expectations Literal article fields, numeric page/limit and UUID establish the valid inputs. Null title, a nonnumeric page and a malformed UUID violate the authored IStore/IRequest/path declarations; Nest's POST201/GET200 and core's invalid-request400 establish statuses independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases Three one-axis valid/invalid request pairs distinguish body, query and parameter injection. Aliased route serialization must retain valid JSON and article values. The existing Go alias and ten-mode protocol tests own validate-family flags and stringifier discriminators; this runtime uses the shared default assert configuration.
 * @evidence contracts/testing.md#execution-ownership The shared SDK consumer discovers this matching case after its public compilation and calls the real installed HTTP application. It starts no project preparation or server of its own.
 * @evidence contracts/e2e.md#necessary-boundary Public compiler alias resolution, emitted validators, Nest parameter factories and the actual HTTP adapter must agree. In-process source units cannot establish request rejection or returned values across the installed connection.
 * @evidence contracts/e2e.md#shared-execution The already authored variable controller gains equivalent import spellings within the same producer and generated consumer. All requests reuse the existing application, installation and compiler phases; no alias-only project or native host is prepared.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The variable routes are stateless, and every request owns fresh query/body/path input. Literal response fields come from this request rather than prior execution. Success and error response bodies are consumed here; the shared runner owns the application and closes it in finally.
 * @evidence contracts/e2e.md#preserved-coverage The former alias case's four configured arguments remain in TestTransformAliasedDecoratorOptions, including the validate report flag and assert route discriminator. This case supplies the actual installed alias connection with malformed controls; original variable controller algorithms, DTOs and route identities remain unchanged.
 */
export const test_api_aliased_request_decorators = async (
  connection: api.IConnection,
): Promise<void> => {
  const route = `${connection.host}/http_rich/variable/bbs/package/section/articles`;
  const input: IBbsArticle.IStore = {
    title: "Alias article",
    body: "Alias body",
    files: [],
  };
  const post = (body: unknown): Promise<Response> =>
    fetch(route, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const stored = await post(input);
  assert.equal(stored.status, 201);
  const article = typia.assert<IBbsArticle>(await stored.json());
  assert.equal(article.section, "section");
  assert.equal(article.title, input.title);
  assert.equal(article.body, input.body);
  assert.deepEqual(article.files, input.files);
  const invalidBody = await post({ ...input, title: null });
  assert.equal(invalidBody.status, 400);
  await invalidBody.arrayBuffer();

  const queried = await fetch(`${route}?page=1&limit=10`);
  assert.equal(queried.status, 200);
  typia.assert<IPage<IBbsArticle.ISummary>>(await queried.json());
  const invalidQuery = await fetch(`${route}?page=wrong&limit=10`);
  assert.equal(invalidQuery.status, 400);
  await invalidQuery.arrayBuffer();

  const id = "00000000-0000-4000-8000-000000000001";
  const selected = await fetch(`${route}/${id}`);
  assert.equal(selected.status, 200);
  const found = typia.assert<IBbsArticle>(await selected.json());
  assert.equal(found.id, id);
  assert.equal(found.section, "section");
  const invalidPath = await fetch(`${route}/invalid-id`);
  assert.equal(invalidPath.status, 400);
  await invalidPath.arrayBuffer();
};
