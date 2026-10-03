import path from "path";

import { EditorTestHarness } from "../../internal/EditorTestHarness";

/**
 * Verifies that the uploader query flag overrides an explicit document URL.
 *
 * The uploader flag gives the user a way to replace a configured document.
 * Presence of an explicit URL must not bypass that choice during mounting.
 *
 * 1. Mount the application with both uploader and explicit URL query keys.
 * 2. Assert the uploader input appears without the iframe loading stage.
 *
 * @evidence contracts/testing.md#behavioral-verification A local DOM mount with uploader and explicit URL renders the package input and omits the loading stage.
 * @evidence contracts/testing.md#independent-expectations Presence of the authored uploader flag requires the upload UI even when an explicit document URL is present.
 * @evidence contracts/testing.md#distinguishing-cases Input presence and loading-text absence distinguish the two UI branches; finally unmounts, closes DOM and restores global descriptors.
 * @evidence contracts/testing.md#execution-ownership The isolated editor browser unit entry discovers this case; caller-built React/editor artifacts execute against local JSDOM, with no installed consumer or product HTTP host.
 */
export const test_editor_application_uploader_override =
  async (): Promise<void> => {
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM("<div id='root'></div>", {
      url: "https://editor.example/?uploader&url=data:application/json,%7B%7D",
    });
    const previous = new Map<string, PropertyDescriptor | undefined>();
    for (const key of [
      "window",
      "document",
      "navigator",
      "HTMLElement",
      "DocumentFragment",
      "IS_REACT_ACT_ENVIRONMENT",
    ]) {
      previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key],
      });
    }
    const rootPath = path.resolve(process.cwd(), "../..");
    const React = require("react");
    const { createRoot } = require(
      path.join(rootPath, "packages/editor/node_modules/react-dom/client"),
    );
    const { act } = React;
    const { NestiaEditorApplication } = require(
      path.join(EditorTestHarness.LIB, "NestiaEditorApplication.js"),
    );
    const root = createRoot(dom.window.document.getElementById("root"));
    try {
      await act(async () => {
        root.render(React.createElement(NestiaEditorApplication));
      });
      const input = dom.window.document.querySelector(
        "input[value='@ORGANIZATION/PROJECT']",
      );
      if (input === null)
        throw new Error("Uploader override did not render the package input.");
      if (
        dom.window.document.body.textContent.includes(
          "Loading OpenAPI Document",
        )
      )
        throw new Error(
          "Uploader override still rendered the document iframe.",
        );
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous)
        if (descriptor === undefined) Reflect.deleteProperty(globalThis, key);
        else Object.defineProperty(globalThis, key, descriptor);
    }
  };
