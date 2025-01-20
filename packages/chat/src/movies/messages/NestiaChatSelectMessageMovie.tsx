import { ExpandMore, Grading } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
} from "@mui/material";
import { INestiaAgentOperationSelection } from "@nestia/agent";
import { useState } from "react";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export const NestiaChatSelectMessageMovie = ({
  selection,
}: NestiaChatSelectMessageMovie.IProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      elevation={3}
      style={{
        marginTop: 15,
        marginBottom: 15,
        marginRight: 200,
      }}
    >
      <CardContent>
        <Chip
          icon={<Grading />}
          label="Function Selector"
          variant="outlined"
          color="warning"
        />
        <br />
        <br />
        Operation:
        {selection.protocol === "http" ? (
          <ul>
            <li>{selection.function.method.toUpperCase()}</li>
            <li>{selection.function.path}</li>
          </ul>
        ) : (
          <ul>
            <li>{selection.function.name}</li>
          </ul>
        )}
        <MarkdownViewer>{selection.reason}</MarkdownViewer>
      </CardContent>
      <CardActions style={{ textAlign: "right" }}>
        <Button
          onClick={() => setExpanded(!expanded)}
          startIcon={
            <ExpandMore
              style={{
                transform: `rotate(${expanded ? 180 : 0}deg)`,
              }}
            />
          }
        >
          {expanded ? "Hide Function Description" : "Show Function Description"}
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <MarkdownViewer>{selection.function.description}</MarkdownViewer>
        </CardContent>
      </Collapse>
    </Card>
  );
};
export namespace NestiaChatSelectMessageMovie {
  export interface IProps {
    selection: INestiaAgentOperationSelection;
  }
}
