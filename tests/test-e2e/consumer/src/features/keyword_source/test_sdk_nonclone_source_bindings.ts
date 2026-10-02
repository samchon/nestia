import assert from "node:assert/strict";

import type {
  IAccount as Account,
  IAccount,
} from "../../../../fixture/src/scenarios/nonclone_alias/structures/IAccount";
import type { IBbsArticle } from "../../../../fixture/src/scenarios/nonclone_import_type/api/structures/IBbsArticle";
import type IMemo from "../../../../fixture/src/scenarios/nonclone_import_type/api/structures/IMemo";
import type * as pagination from "../../../../fixture/src/scenarios/nonclone_import_type/api/structures/IPage";
import api from "../../api_source";

/**
 * Verifies positional nonclone resolves original alias/default/namespace DTO
 * modules.
 *
 * Distinct generated options must connect to the original producer classes;
 * imported type equality alone cannot certify their actual caller ABI.
 *
 * 1. Compile the generated binding under its own profile and original DTO graph.
 * 2. Execute independent literal calls on the existing shared adapter backend.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated Account and adjacent IAccount calls return account/control literals. Default IMemo and namespace IPage of named IBbsArticle are consumed as actual source types by generated operations.
 * @evidence contracts/testing.md#independent-expectations Original AccountController returns the independent id literals account/control. Authored IMemo content is string and IPage pagination fields are numbers; source modules independently define those expectations.
 * @evidence contracts/testing.md#distinguishing-cases Named imported alias and adjacent unaliased export, default interface, namespace generic and nested article DTO bindings retain distinct compiled identities.
 * @evidence contracts/testing.md#execution-ownership One matching export is discovered by the ordinary installed shared consumer after its single compilation and awaited per adapter.
 * @evidence contracts/e2e.md#necessary-boundary Actual installed source metadata, generated bindings and HTTP requests must agree; pure writer tests cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution Four additional SDK outputs and one automatic source-ABI E2E generation reuse the existing producer/consumer compiler requests and installation. The nonclone profiles share one separately counted no-listen app; this case acquires no app or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Independent request values and scenario namespaces isolate calls; the common entry owns the sequential adapter backends and sandbox lifetime.
 * @evidence contracts/e2e.md#preserved-coverage This case owns the named profile/source bindings described here, alongside copied original collision/destructuring controls and separately preserved artifact assertions; it does not certify untransferred profiles from compile success.
 */

export const test_sdk_nonclone_source_bindings = async (
  connection: api.IConnection,
): Promise<void> => {
  const account: Account = await api.functional.accounts.get(connection);
  const control: IAccount = await api.functional.accounts.control(connection);
  assert.deepEqual(account, { id: "account" });
  assert.deepEqual(control, { id: "control" });
  const memo: IMemo =
    await api.functional.nonclone_import_type.bbs.articles.memo(connection);
  assert.equal(typeof memo.content, "string");
  const page: pagination.IPage<IBbsArticle> =
    await api.functional.nonclone_import_type.bbs.articles.index(connection);
  assert.ok(Array.isArray(page.data));
  for (const name of ["current", "limit", "records", "pages"] as const)
    assert.equal(typeof page.pagination[name], "number");
};
