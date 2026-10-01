import { IConnection, PlainFetcher } from "@nestia/fetcher";
import assert from "assert/strict";

/**
 * Verifies undefined request headers are accepted and omitted at the transport
 * boundary.
 *
 * Optional generated headers can contain undefined. FetcherBase already omits
 * those entries; the public connection type must describe the same input while
 * preserving atomic values and the specialized header restrictions.
 *
 * 1. Pass omitted, atomic and array headers through a supplied fetch callback.
 * 2. Assert literal transmitted lines and unchanged caller input.
 * 3. Retain language-level rejection controls for invalid values and header forms.
 *
 * @evidence contracts/testing.md#behavioral-verification PlainFetcher.fetch accepts a typed connection and passes only defined, stringified header lines to its supplied fetch callback. TypeScript language preparation checks public header acceptance and adjacent invalid value, cookie and singleton assignments, including optional and mixed array domains.
 * @evidence contracts/testing.md#independent-expectations Undefined denotes an omitted entry; boolean, number and bigint stringify to their literal decimal/boolean text, while array values produce separate lines. The route owns request media: a bodyless request has none and a JSON body supplies its declared Content-Type. HeaderValue excludes object/null, and Headerify requires array set-cookie and scalar singleton content-type.
 * @evidence contracts/testing.md#distinguishing-cases Undefined-only and empty inputs contrast mixed atomic/array headers; object/null values, scalar set-cookie and required/optional array content-type remain rejected. Optional cookie arrays and undefined-only named headers remain permitted, while a scalar/array singleton union is rejected. Identical caller headers contrast bodyless omission with JSON-body route media, and caller input remains unchanged.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered by test-sdk. Public fetcher calls use the supported per-connection fetch callback in-process without sockets, installation, native artifact builds or product fixture compilation; type checks belong to ordinary test-language preparation.
 */
export const test_fetcher_undefined_request_headers =
  async (): Promise<void> => {
    // @ts-expect-error object header values are unsupported
    const invalidValue: IConnection.HeaderValue = { nested: true };
    // @ts-expect-error null is not an atomic header value
    const invalidNull: IConnection.HeaderValue = null;
    const invalidCookie: IConnection.Headerify<{ "set-cookie": string }> = {
      // @ts-expect-error set-cookie requires an array
      "set-cookie": "single",
    };
    const invalidSingleton: IConnection.Headerify<{
      "content-type": string[];
    }> = {
      // @ts-expect-error content-type is a singleton header
      "content-type": ["application/json"],
    };
    void [invalidValue, invalidNull, invalidCookie, invalidSingleton];
    const optionalCookie: IConnection.Headerify<{ "set-cookie"?: string[] }> = {
      "set-cookie": ["a=1", "b=2"],
    };
    const optionalSingleton: IConnection.Headerify<{
      "content-type"?: string[];
    }> = {
      // @ts-expect-error optional content-type must still reject array values
      "content-type": ["application/json"],
    };
    const mixedSingleton: IConnection.Headerify<{
      "content-type": string | string[];
    }> = {
      // @ts-expect-error a singleton domain cannot include array values
      "content-type": ["application/json"],
    };
    const omittedNamed: IConnection.Headerify<{
      "set-cookie": undefined;
      "content-type": undefined;
    }> = {
      "set-cookie": undefined,
      "content-type": undefined,
    };
    assert.deepEqual(optionalCookie["set-cookie"], ["a=1", "b=2"]);
    assert.deepEqual(omittedNamed, {
      "set-cookie": undefined,
      "content-type": undefined,
    });
    void [optionalSingleton, mixedSingleton];
    for (const [headers, expected, body] of [
      [{}, []],
      [{ missing: undefined }, []],
      [
        { "set-cookie": ["a=1", "b=2"], "content-type": "application/xml" },
        [
          ["set-cookie", "a=1"],
          ["set-cookie", "b=2"],
        ],
      ],
      [
        { "set-cookie": ["a=1", "b=2"], "content-type": "application/xml" },
        [
          ["set-cookie", "a=1"],
          ["set-cookie", "b=2"],
          ["Content-Type", "application/json"],
        ],
        { active: true },
      ],
      [
        {
          missing: undefined,
          flag: true,
          count: 17,
          wide: 19n,
          labels: ["a", "b"],
        },
        [
          ["flag", "true"],
          ["count", "17"],
          ["wide", "19"],
          ["labels", "a"],
          ["labels", "b"],
        ],
      ],
    ] as [
      Record<string, IConnection.HeaderValue | undefined>,
      [string, string][],
      { active: boolean }?,
    ][]) {
      const originalHeaders = structuredClone(headers);
      let captured: unknown;
      let capturedBody: unknown;
      const connection: IConnection = {
        host: "https://headers.example",
        headers,
        fetch: async (_input, init) => {
          captured = init?.headers;
          capturedBody = init?.body;
          return new Response("null", { status: 200 });
        },
      };
      await PlainFetcher.fetch(
        connection,
        {
          method: body === undefined ? "GET" : "POST",
          path: "/headers",
          status: 200,
          request:
            body === undefined
              ? null
              : { type: "application/json", encrypted: false },
          response: { type: "application/json", encrypted: false },
        },
        body,
      );
      assert.deepEqual(captured, expected);
      assert.equal(
        capturedBody,
        body === undefined ? undefined : '{"active":true}',
      );
      assert.deepEqual(headers, originalHeaders);
      if ("missing" in headers) {
        assert.ok(Object.hasOwn(headers, "missing"));
        assert.equal(headers.missing, undefined);
      }
    }
    const specialized: IConnection<{
      "set-cookie": string[];
      "content-type": string;
    }> = {
      host: "https://headers.example",
      headers: {
        "set-cookie": ["a=1", "b=2"],
        "content-type": "application/json",
        omitted: undefined,
      },
    };
    assert.deepEqual(specialized.headers?.["set-cookie"], ["a=1", "b=2"]);
  };
