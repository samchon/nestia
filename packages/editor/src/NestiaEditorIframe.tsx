import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@typia/interface";
import { load } from "js-yaml";
import React from "react";
import { IValidation } from "typia";

import { NestiaEditorArchiver } from "./internal/NestiaEditorArchiver";
import { NestiaEditorComposer } from "./internal/NestiaEditorComposer";
import { NESTIA_EDITOR_DEFAULT_PACKAGE } from "./internal/NestiaEditorDefaultPackage";

/**
 * Composes a project from an OpenAPI document and offers it as a zip download.
 *
 * The component loads the document, from a URL or from the object given,
 * generates the project in the browser, and shows the three stages as a
 * stepper. A fetch failure or a composition failure is reported in place of the
 * stage's progress, and the operations the composer could not convert are
 * listed beside the download, so an incomplete project never passes for a
 * complete one.
 *
 * @evidence contracts/common.md#principled-implementation The three stages run once, in order, from an effect: load the document, compose it with NestiaEditorComposer, and expose the files for download. Document-loading and composer failure results set their stage error states. Operations the composer skipped are listed with the download. Unexpected errors outside these operations are logged by the outer catch without setting an error state; only completed stages advance the stepper.
 * @evidence contracts/common.md#clear-and-simple-design One component owns the stepper state; document loading and operation counting stay in the private `getDocument` and `aggregateOperation`, and archiving and composition are delegated to their own namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The option defaults (keyword, simulate, e2e enabled) are the documented product defaults, and the archive name comes from the shared default package constant, not from a fixture name.
 * @evidence contracts/common.md#meaningful-documentation The comment states the stages and how failures appear.
 */
export function NestiaEditorIframe(props: NestiaEditorIframe.IProps) {
  const [step, setStep] = React.useState(0);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [operations, setOperationCount] = React.useState<
    Record<string, number>
  >({});
  const [composerError, setComposerError] = React.useState<any | null>(null);
  const [files, setFiles] = React.useState<Record<string, string> | null>(null);
  const [skipped, setSkipped] = React.useState<NestiaEditorComposer.ISkipped[]>(
    [],
  );
  const archive: string = NestiaEditorArchiver.name(
    props.package ?? NESTIA_EDITOR_DEFAULT_PACKAGE,
  );

  React.useEffect(() => {
    (async () => {
      // LOADING OPENAPI DOCUMENTS
      setStep(0);
      const document:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument
        | string =
        typeof props.swagger === "string"
          ? await getDocument(props.swagger)
          : props.swagger;
      if (typeof document === "string") {
        setFetchError(document);
        return;
      } else setOperationCount(aggregateOperation(document));

      // GENERATING SOFTWARE DEVELOPMENT KIT
      setStep(1);
      const result: IValidation<NestiaEditorComposer.IOutput> =
        await (async () => {
          try {
            return await NestiaEditorComposer[props.mode ?? "sdk"]({
              document,
              keyword: props.keyword ?? true,
              simulate: props.simulate ?? true,
              e2e: props.e2e ?? true,
              package: props.package ?? NESTIA_EDITOR_DEFAULT_PACKAGE,
            });
          } catch (exp) {
            return {
              success: false,
              errors: exp as any,
              data: undefined,
            } satisfies IValidation.IFailure;
          }
        })();
      if (result.success === false) {
        setComposerError(result.errors);
        return;
      }

      // READY TO DOWNLOAD
      setStep(2);
      setSkipped(result.data.skipped);
      setFiles(result.data.files);
    })().catch((exp) => {
      console.error("unknown error", exp);
    });
  }, []);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 25,
          overflow: "auto",
        }}
      >
        <Typography variant="h4">Nestia Editor</Typography>
        <hr />
        <br />
        <Stepper activeStep={step} orientation="vertical" nonLinear={true}>
          <Step key={0}>
            <StepLabel>
              <Typography variant="h5">Loading OpenAPI Document</Typography>
            </StepLabel>
            <StepContent>
              <br />
              <CircularProgress size={100} color="success" />
              <br />
              <br />
              {typeof props.swagger === "string" ? (
                <>
                  <p>Fetching OpenAPI Document from</p>
                  <p>
                    <a href={props.swagger} target="_blank">
                      {props.swagger}
                    </a>
                  </p>
                </>
              ) : (
                "Delivering OpenAPI Document to the composer"
              )}
              {fetchError !== null ? (
                <Alert severity="error">
                  <AlertTitle>Fetch Error</AlertTitle>
                  {fetchError}
                </Alert>
              ) : null}
            </StepContent>
          </Step>
          <Step key={1}>
            <StepLabel>
              <Typography variant="h5">
                Generating Software Development Kit
              </Typography>
            </StepLabel>
            <StepContent>
              <br />
              <CircularProgress size={100} color="success" />
              <br />
              <br />
              Generating SDK functions...
              <br />
              <ul>
                <li>
                  total operations: #
                  {Object.values(operations)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </li>
                {Object.entries(operations).map(([method, count]) => (
                  <li key={method}>
                    {method}: #{count.toLocaleString()}
                  </li>
                ))}
              </ul>
              {composerError !== null ? (
                <>
                  <br />
                  <Alert severity="error">
                    <AlertTitle>Composition Error</AlertTitle>
                    <pre>{JSON.stringify(composerError, null, 2)}</pre>
                  </Alert>
                </>
              ) : null}
            </StepContent>
          </Step>
          <Step key={2}>
            <StepLabel>
              <Typography variant="h5">
                Downloading TypeScript Project
              </Typography>
            </StepLabel>
            <StepContent>
              <br />
              {files !== null ? (
                <>
                  <p>
                    {Object.keys(files).length.toLocaleString()} files are
                    ready.
                  </p>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={() =>
                      NestiaEditorArchiver.download({
                        name: archive,
                        files,
                      })
                    }
                  >
                    Download {archive}
                  </Button>
                  {skipped.length !== 0 ? (
                    <>
                      <br />
                      <br />
                      <Alert severity="warning">
                        <AlertTitle>Skipped Operations</AlertTitle>
                        The project leaves out operations that could not be
                        converted:
                        <ul>
                          {skipped.map((s) => (
                            <li key={`${s.method} ${s.path}`}>
                              {s.method} {s.path}: {s.messages.join(" ")}
                            </li>
                          ))}
                        </ul>
                      </Alert>
                    </>
                  ) : null}
                </>
              ) : null}
            </StepContent>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
/**
 * Properties of {@link NestiaEditorIframe}.
 *
 * `swagger` is an OpenAPI document or the URL to fetch it from. The options
 * mirror the generator options; `mode` is internal.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the property type of the component with the same name, so the component and its inputs are one public identity.
 * @evidence contracts/common.md#clear-and-simple-design It contains one interface and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no behavior; the option defaults live in the component that reads them.
 * @evidence contracts/common.md#meaningful-documentation The comment states what `swagger` accepts and which members are internal.
 */
export namespace NestiaEditorIframe {
  export interface IProps {
    /** Source document or URL loaded once when this component mounts. */
    swagger:
      | string
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument;

    /** Generated package identity; defaults to @ORGANIZATION/PROJECT. */
    package?: string;

    /** Enable keyword parameter objects; enabled when omitted. */
    keyword?: boolean;

    /** Include SDK simulators; enabled when omitted. */
    simulate?: boolean;

    /** Include generated E2E functions; enabled when omitted. */
    e2e?: boolean;

    /** @internal */
    mode?: "nest" | "sdk";
  }
}

const getDocument = async (
  url: string,
): Promise<
  SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument | string
> => {
  try {
    const response: Response = await fetch(url);
    if (response.status !== 200) return await response.text();
    else if (url.endsWith(".yaml")) {
      const text: string = await response.text();
      return load(text) as OpenApiV3.IDocument;
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) return error.message;
    return "Unknown error";
  }
};

const aggregateOperation = (
  document: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument,
): Record<string, number> => {
  const map: Record<string, number> = {};
  if (!(typeof document === "object" && document !== null)) return map;
  for (const collection of Object.values(document.paths ?? {}))
    if (typeof collection === "object" && collection !== null)
      for (const [method] of Object.entries(collection))
        if (
          method === "head" ||
          method === "get" ||
          method === "post" ||
          method === "patch" ||
          method === "put" ||
          method === "delete"
        )
          map[method] = (map[method] ?? 0) + 1;
  return map;
};
