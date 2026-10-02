import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";

/**
 * Verifies the request URL carries exactly one separator between host and path.
 *
 * Locks the host/path join in the fetcher. `@nestia/sdk` always emits a
 * leading-slash route path, so a `connection.host` that ends with a slash used
 * to produce `http://host//route`. `new URL()` does not collapse a doubled
 * separator inside a pathname, so the extra segment reached the server and most
 * routers answered 404 for every SDK call. The no-slash spellings are kept as
 * controls, because a join that merely trims everything would pass the failing
 * case while corrupting a host that carries its own base path.
 *
 * 1. Drive `PlainFetcher.fetch` through a custom `connection.fetch` that captures
 *    the requested URL instead of sending it.
 * 2. Walk every combination of trailing separators on the host and leading
 *    separators on the path, including a base-path host and repeated
 *    separators.
 * 3. Assert each captured URL equals the host and path joined by one separator.
 */
export async function test_fetcher_host_and_path_join(): Promise<void> {
  const capture = async (host: string, path: string): Promise<string> => {
    let captured: string = "";
    await PlainFetcher.fetch(
      {
        host,
        fetch: async (input) => {
          captured = input as string;
          return new Response("null", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      },
      {
        method: "GET",
        path,
        status: 200,
        request: null,
        response: {
          type: "application/json",
          encrypted: false,
        },
      },
    );
    return captured;
  };

  const cases: [string, string, string][] = [
    // positive: neither side spells the separator twice
    ["https://example.com", "/health", "https://example.com/health"],
    // negative twin: host now ends with the separator
    ["https://example.com/", "/health", "https://example.com/health"],
    // remaining two spellings of the same pair
    ["https://example.com", "health", "https://example.com/health"],
    ["https://example.com/", "health", "https://example.com/health"],
    // a host carrying its own base path keeps every interior segment
    ["https://example.com/api", "/health", "https://example.com/api/health"],
    ["https://example.com/api/", "/health", "https://example.com/api/health"],
    // boundary: repeated separators collapse to one on either side
    ["https://example.com//", "/health", "https://example.com/health"],
    ["https://example.com", "//health", "https://example.com/health"],
    // boundary: an interior separator of the path is not a boundary separator
    ["https://example.com/", "/a//b", "https://example.com/a//b"],
  ];
  for (const [host, path, expected] of cases)
    TestValidator.equals(
      `${JSON.stringify(host)} + ${JSON.stringify(path)}`,
      await capture(host, path),
      expected,
    );
}
