import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { INestiaAgentOperationSelection } from "@nestia/agent";
import React from "react";
import Markdown from "react-markdown";

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
            <Markdown>{select.function.description}</Markdown>
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
