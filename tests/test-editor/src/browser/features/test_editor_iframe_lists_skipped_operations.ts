import assert from "assert";
import path from "path";

import { EditorTestHarness } from "../../features/editor/internal/EditorTestHarness";

/**
 * Verifies the editor page lists the operations it could not convert beside the
 * download.
 *
 * `@nestia/migrate` leaves out an operation it cannot convert and reports it,
 * and the uploader showed that report, but the iframe flow, which the static
 * application uses, dropped it, so the downloaded project silently lacked an
 * operation.
 *
 * 1. Render the built iframe with a document holding a convertible and an
 *    unconvertible operation, and wait for the real composition to finish.
 * 2. Assert the page shows the skipped heading, the method and the path.
 * 3. Render a document with only the convertible operation and assert no such list
 *    appears.
 *
 * @evidence contracts/testing.md#behavioral-verification The real React renderer runs the built iframe and its effect, which calls the real composer, and the rendered tree must contain the skipped heading with the migrate-reported method and path; the composer and the component are not replaced.
 * @evidence contracts/testing.md#independent-expectations The skipped operation is an application/octet-stream response, which migrate documents as unconvertible, and the expected text is the method and path written in the document.
 * @evidence contracts/testing.md#distinguishing-cases The document with an octet-stream operation is the positive case, the same document without it is the negative twin, and the download-ready text proves composition finished in both.
 * @evidence contracts/testing.md#execution-ownership The test-editor browser entry discovers this export in its isolated process; one jsdom window supplies the DOM before the component loads and its globals are restored in finally, every renderer is unmounted, and no browser, server or installed consumer is started.
 */
export const test_editor_iframe_lists_skipped_operations =
  async (): Promise<void> => {
    const Renderer: {
      act: (callback: () => Promise<void>) => Promise<void>;
      create: (
        element: unknown,
        options: { createNodeMock: (element: { type: string }) => HTMLElement },
      ) => { toJSON: () => unknown; unmount: () => void };
    } = require("react-test-renderer");
    const React: {
      createElement: (type: unknown, props: unknown) => unknown;
    } = require(
      path.join(EditorTestHarness.ROOT, "packages/editor/node_modules/react"),
    );
    const { JSDOM } = require("jsdom") as {
      JSDOM: new (
        content: string,
        options: { url: string },
      ) => {
        window: Window & {
          close: () => void;
          HTMLElement: typeof HTMLElement;
          Node: typeof Node;
        };
      };
    };
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "https://example.invalid/editor/",
    });
    const globals = ["window", "document", "HTMLElement", "Node"] as const;
    const previous = globals.map((key) =>
      Object.getOwnPropertyDescriptor(globalThis, key),
    );
    const ok = {
      get: {
        responses: {
          200: {
            description: "items",
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    };
    const skipped = {
      get: {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "binary",
            content: {
              "application/octet-stream": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    };
    const document = (paths: object) => ({
      openapi: "3.1.0",
      info: { title: "Skipped operations", version: "1.0.0" },
      paths,
      components: {},
    });
    try {
      for (const [key, value] of [
        ["window", dom.window],
        ["document", (dom.window as any).document],
        ["HTMLElement", dom.window.HTMLElement],
        ["Node", dom.window.Node],
      ] as const)
        Object.defineProperty(globalThis, key, { configurable: true, value });
      const { NestiaEditorIframe } = require(
        path.join(EditorTestHarness.LIB, "index.js"),
      );
      const render = async (swagger: object): Promise<string> => {
        let renderer: ReturnType<typeof Renderer.create> | undefined;
        try {
          await Renderer.act(async () => {
            renderer = Renderer.create(
              React.createElement(NestiaEditorIframe, {
                swagger,
                mode: "sdk",
                keyword: true,
                simulate: false,
                e2e: false,
              }),
              {
                createNodeMock: (element) =>
                  dom.window.document.createElement(element.type),
              },
            );
          });
          for (let i = 0; i < 600; ++i) {
            const text: string = JSON.stringify(renderer!.toJSON());
            if (text.includes("files are")) return text;
            await Renderer.act(
              () => new Promise<void>((resolve) => setTimeout(resolve, 100)),
            );
          }
          throw new Error("The composition did not finish.");
        } finally {
          await Renderer.act(async () => renderer?.unmount());
        }
      };
      const flagged: string = await render(
        document({ "/items": ok, "/files/{id}": skipped }),
      );
      assert.ok(flagged.includes("Skipped Operations"), "heading");
      assert.ok(flagged.includes("/files/{id}"), "path");
      assert.ok(flagged.includes("GET"), "method");
      const clean: string = await render(document({ "/items": ok }));
      assert.equal(clean.includes("Skipped Operations"), false, "clean twin");
    } finally {
      for (const [index, key] of globals.entries()) {
        const descriptor = previous[index];
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  };
