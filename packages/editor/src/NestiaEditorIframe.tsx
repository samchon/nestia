import {
  Alert,
  AlertTitle,
  CircularProgress,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import StackBlitzSDK from "@stackblitz/sdk";
import { load } from "js-yaml";
import React from "react";
import { IValidation } from "typia";

import { NestiaEditorComposer } from "./internal/NestiaEditorComposer";

export function NestiaEditorIframe(props: NestiaEditorIframe.IProps) {
  const [id] = React.useState(
    `reactia-editor-div-${Math.random().toString().substring(2)}`,
  );
  const [step, setStep] = React.useState(0);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [operations, setOperationCount] = React.useState<
    Record<string, number>
  >({});
  const [composerError, setComposerError] = React.useState<any | null>(null);

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
              simulate: props.simulate ?? true,
              e2e: props.e2e ?? true,
              package: props.package ?? "@ORGANIZATION/PROJECT",
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

      // COMPOSING STACKBLITZ PROJECT
      setStep(2);
      StackBlitzSDK.embedProject(
        id,
        {
          title: document.info?.title ?? "Nestia Editor",
          template: "node",
          files: result.data.files,
        },
        {
          width: "100%",
          height: "100%",
          openFile: result.data.openFile,
          startScript: result.data.startScript as any, // no problem
        },
      );
    })().catch((exp) => {
      console.error("unknown error", exp);
    });
  }, []);
  return (
    <div
      id={id}
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
                  <li>
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
              <Typography variant="h5">Composing TypeScript Project</Typography>
            </StepLabel>
            <StepContent></StepContent>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
export namespace NestiaEditorIframe {
  export interface IProps {
    swagger:
      | string
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument;
    package?: string;
    simulate?: boolean;
    e2e?: boolean;

    /**
     * @internal
     */
    mode?: "nest" | "sdk";

    /**
     * @internal
     */
    files?: Record<string, string>;
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
