import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Collapse,
} from "@mui/material";
import { INestiaAgentPrompt } from "@nestia/agent";
import { useState } from "react";

import { MarkdownViewer } from "../../components/MarkdownViewer";
import { NestiaChatExecuteMessageMovie } from "./NestiaChatExecuteMessageMovie";

export const NestiaChatDescribeMessageMovie = ({
  prompt,
}: NestiaChatDescribeMessageMovie.IProps) => {
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
        <Chip label="Function Describer" variant="outlined" color="secondary" />
        <MarkdownViewer>{prompt.text}</MarkdownViewer>
      </CardContent>
      <CardActions style={{ textAlign: "right" }}>
        <Button
          startIcon={
            <ExpandMoreIcon
              style={{
                transform: `rotate(${expanded ? 180 : 0}deg)`,
              }}
            />
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide Function Calls" : "Show Function Calls"}
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {prompt.executions.map((execute) => (
            <NestiaChatExecuteMessageMovie execute={execute} />
          ))}
        </CardContent>
      </Collapse>
    </Card>
  );
};
export namespace NestiaChatDescribeMessageMovie {
  export interface IProps {
    prompt: INestiaAgentPrompt.IDescribe;
  }
}
