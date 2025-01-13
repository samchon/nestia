import { ExpandMore } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Typography,
} from "@mui/material";
import { INestiaAgentPrompt } from "@nestia/agent";
import { useState } from "react";
import Markdown from "react-markdown";

import { NestiaChatExecuteMessageMovie } from "./NestiaChatExecuteMessageMovie";

export const NestiaChatDescribeMessageMovie = ({
  prompt,
}: NestiaChatDescribeMessageMovie.IProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      elevation={3}
      style={{
        marginTop: 25,
        marginBottom: 25,
        marginRight: 200,
      }}
    >
      <CardContent>
        <Typography variant="h5">Function Calling</Typography>
        <hr />
        <Markdown>{prompt.text}</Markdown>
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
