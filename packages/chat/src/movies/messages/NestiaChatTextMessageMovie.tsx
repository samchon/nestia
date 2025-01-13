import { Card, CardContent, Typography } from "@mui/material";
import { INestiaAgentPrompt } from "@nestia/agent";
import Markdown from "react-markdown";

export const NestiaChatTextMessageMovie = ({
  prompt,
}: NestiaChatTextMessageMovie.IProps) => {
  return (
    <div style={{ width: "100%" }}>
      <Card
        elevation={3}
        style={{
          marginTop: 25,
          marginBottom: 25,
          textAlign: prompt.role === "user" ? "right" : undefined,
          marginLeft: prompt.role === "user" ? 200 : undefined,
          marginRight: prompt.role === "assistant" ? 200 : undefined,
        }}
      >
        <CardContent>
          <Typography variant="h5">{prompt.role}</Typography>
          <hr />
          <Markdown>{prompt.text}</Markdown>
        </CardContent>
      </Card>
    </div>
  );
};
export namespace NestiaChatTextMessageMovie {
  export interface IProps {
    prompt: INestiaAgentPrompt.IText;
  }
}
