import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { INestiaAgentOperationSelection } from "@nestia/agent";
import React from "react";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export const NestiaChatFunctionStackSideMovie = (
  props: NestiaChatFunctionStackSideMovie.IProps,
) => {
  return (
    <React.Fragment>
      <Typography variant="h5"> Function Stack </Typography>
      <hr />
      {props.selections.map((select) => (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h6">
              {select.protocol === "http"
                ? `${select.function.method.toUpperCase()} ${select.function.path}`
                : select.function.name}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <hr />
            {select.reason}
            <br />
            <br />
            <MarkdownViewer>{select.function.description}</MarkdownViewer>
          </AccordionDetails>
        </Accordion>
      ))}
    </React.Fragment>
  );
};
export namespace NestiaChatFunctionStackSideMovie {
  export interface IProps {
    selections: INestiaAgentOperationSelection[];
  }
}
