import assert from "assert";
import path from "path";

import { EditorTestHarness } from "../../features/editor/internal/EditorTestHarness";

/**
 * Verifies the static editor forwards parsed keyword options to its iframe.
 *
 * Omitting the keyword prop silently substitutes the iframe's true default for
 * an explicit false setting. Actual React effects must connect query and window
 * inputs to the child rather than only testing a detached parser.
 *
 * 1. Render the built application with a real jsdom window and data-URL document.
 * 2. Vary query values, window settings, precedence and defaults in both modes.
 * 3. Inspect the actual iframe's props and retain its other option controls.
 *
 * @evidence contracts/testing.md#behavioral-verification The real React renderer runs the built application and its effects, then exposes the actual iframe instance. Literal keyword assertions detect a dropped prop after document, package, simulation and e2e forwarding controls; neither hooks, fetch nor the composer are replaced.
 * @evidence contracts/testing.md#independent-expectations True and 1 enable boolean query settings; explicit false/0/empty disable them, query values precede window settings and absent static settings are false. These literal option expectations come from the documented static application contract, not its parser or generator output.
 * @evidence contracts/testing.md#distinguishing-cases Nine settings are exercised in each SDK and Nest mode: false/true/1/0/empty query values against opposing window settings, true/false/1 window-only settings and the absent default. The actual data URL, package, selected mode and false simulation/e2e options remain controls in all eighteen scenarios; composer and uploader content assertions remain in their existing cases.
 * @evidence contracts/testing.md#execution-ownership The test-unit browser entry discovers this matching export in its own TypeScript process, isolating DOM-dependent module initialization from utility/SSR units. One jsdom window supplies document and DOM constructors before component loading; URL and keyword settings reset between scenarios. Every renderer is unmounted, the window closed and global descriptors restored. No browser process, server, installed consumer or native build is started by the case.
 */
export const test_editor_application_keyword_options =
  async (): Promise<void> => {
    const React: {
      createElement: (type: unknown) => unknown;
    } = require(
      path.join(EditorTestHarness.ROOT, "packages/editor/node_modules/react"),
    );
    const Renderer: {
      act: (callback: () => Promise<void>) => Promise<void>;
      create: (
        element: unknown,
        options: { createNodeMock: (element: { type: string }) => HTMLElement },
      ) => {
        root: {
          findByType: (type: unknown) => { props: Record<string, unknown> };
        };
        unmount: () => void;
      };
    } = require("react-test-renderer");
    const {
      JSDOM,
    }: {
      JSDOM: new (
        content: string,
        options: { url: string },
      ) => {
        window: Window & {
          close: () => void;
          keyword?: boolean | string;
          HTMLElement: typeof HTMLElement;
          Node: typeof Node;
        };
        reconfigure: (options: { url: string }) => void;
      };
    } = require("jsdom");
    const url: string =
      "data:application/json," +
      encodeURIComponent(
        JSON.stringify({
          openapi: "3.1.0",
          info: { title: "Keyword options", version: "1.0.0" },
          paths: {},
        }),
      );
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "https://example.invalid/editor/",
    });
    const globals = ["window", "document", "HTMLElement", "Node"] as const;
    const previous = globals.map((key) =>
      Object.getOwnPropertyDescriptor(globalThis, key),
    );
    try {
      for (const [key, value] of [
        ["window", dom.window],
        ["document", dom.window.document],
        ["HTMLElement", dom.window.HTMLElement],
        ["Node", dom.window.Node],
      ] as const)
        Object.defineProperty(globalThis, key, { configurable: true, value });
      const { NestiaEditorApplication, NestiaEditorIframe } = require(
        path.join(EditorTestHarness.LIB, "index.js"),
      );
      for (const mode of ["sdk", "nest"] as const) {
        for (const [title, query, setting, expected] of [
          ["query false", "false", true, false],
          ["query true", "true", false, true],
          ["query one", "1", false, true],
          ["query zero", "0", true, false],
          ["query empty", "", true, false],
          ["window true", undefined, true, true],
          ["window false", undefined, false, false],
          ["window one", undefined, "1", true],
          ["default", undefined, undefined, false],
        ] as const) {
          const params = new URLSearchParams({
            url,
            mode,
            package: "@control/project",
            simulate: "false",
            e2e: "false",
          });
          if (query !== undefined) params.set("keyword", query);
          dom.reconfigure({
            url: `https://example.invalid/editor/?${params}`,
          });
          if (setting !== undefined) dom.window.keyword = setting;
          else Reflect.deleteProperty(dom.window, "keyword");
          let renderer: ReturnType<typeof Renderer.create> | undefined;
          try {
            await Renderer.act(async () => {
              renderer = Renderer.create(
                React.createElement(NestiaEditorApplication),
                {
                  createNodeMock: (element) =>
                    dom.window.document.createElement(element.type),
                },
              );
            });
            assert.ok(renderer, title);
            const props = renderer.root.findByType(NestiaEditorIframe).props;
            assert.equal(props.swagger, url, `${title} document`);
            assert.equal(props.package, "@control/project", `${title} package`);
            assert.equal(props.simulate, false, `${title} simulation`);
            assert.equal(props.e2e, false, `${title} e2e`);
            assert.equal(props.mode, mode, `${title} mode`);
            assert.equal(props.keyword, expected, `${title} keyword`);
          } finally {
            await Renderer.act(async () => renderer?.unmount());
          }
        }
      }
    } finally {
      for (const [index, key] of globals.entries()) {
        const descriptor = previous[index];
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  };
