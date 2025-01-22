import FaceIcon from "@mui/icons-material/Face";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { Card, CardContent, Chip } from "@mui/material";
import { INestiaAgentPrompt } from "@nestia/agent";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export const NestiaChatTextMessageMovie = ({
  prompt,
}: NestiaChatTextMessageMovie.IProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: prompt.role === "user" ? "flex-end" : "flex-start",
      }}
    >
      <Card
        elevation={3}
        style={{
          marginTop: 15,
          marginBottom: 15,
          marginLeft: prompt.role === "user" ? 200 : undefined,
          marginRight: prompt.role === "assistant" ? 200 : undefined,
          textAlign: prompt.role === "user" ? "right" : "left",
          backgroundColor: prompt.role === "user" ? "lightyellow" : undefined,
        }}
      >
        <CardContent>
          <Chip
            icon={prompt.role === "user" ? <FaceIcon /> : <SmartToyIcon />}
            label={prompt.role === "user" ? "User" : "Assistant"}
            variant="outlined"
            color={prompt.role === "user" ? "primary" : "success"}
          />
          <MarkdownViewer>{prompt.text}</MarkdownViewer>
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
