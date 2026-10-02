import path from "path";

/**
 * Verifies that the uploader query flag overrides an explicit document URL.
 *
 * The uploader flag gives the user a way to replace a configured document.
 * Presence of an explicit URL must not bypass that choice during mounting.
 *
 * 1. Mount the application with both uploader and explicit URL query keys.
 * 2. Assert the uploader input appears without the iframe loading stage.
 *
 * @evidence contracts/testing.md#behavioral-verification Mounts the built application with both uploader and url query keys, requiring the actual uploader input and excluding the iframe document-loading stage.
 * @evidence contracts/testing.md#independent-expectations The application query contract gives presence of uploader priority over document discovery; the package input and absence of iframe loading text observe that independent choice.
 * @evidence contracts/testing.md#distinguishing-cases The explicit URL is the adjacent competing branch that must lose when uploader is present. SSR default input propagation remains in its separate test population.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this browser unit in its own process. JSDOM supplies the DOM boundary and React mounts built components directly without a consumer installation or product host.
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
      path.join(rootPath, "packages/editor/lib/NestiaEditorApplication.js"),
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
