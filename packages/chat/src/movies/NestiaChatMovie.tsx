import SendIcon from "@mui/icons-material/Send";
import {
  AppBar,
  Button,
  Container,
  Grid,
  Input,
  Toolbar,
  Typography,
} from "@mui/material";
import { INestiaAgentOperationSelection, NestiaAgent } from "@nestia/agent";
import { useEffect, useState } from "react";
import React from "react";

import { NestiaChatMessageMovie } from "./messages/NestiaChatMessageMovie";
import { NestiaChatSideMovie } from "./sides/NestiaChatSideMovie";

export const NestiaChatMovie = ({ agent }: NestiaChatMovie.IProps) => {
  const [text, setText] = useState("");
  const [histories, setHistories] = useState(agent.getPromptHistories());
  const [tokenUsage, setTokenUsage] = useState(agent.getTokenUsage());

  const [enabled, setEnabled] = useState(true);
  const [selections, setSelections] = useState<
    INestiaAgentOperationSelection[]
  >([]);

  useEffect(() => {
    (
      document.getElementById("conversate_input") as
        | HTMLInputElement
        | undefined
    )?.select();
    agent.on("text", (evt) => setHistories([...histories, evt]));
    agent.on("describe", (evt) => setHistories([...histories, evt]));
    agent.on("select", (evt) =>
      setSelections([
        ...selections,
        {
          ...evt.operation,
          reason: evt.reason,
          toJSON: () => ({}),
        } as any,
      ]),
    );
    // agent.on("cancel", (evt) => {
    //   const target: INestiaAgentOperationSelection | undefined =
    //     selections.find(
    //       (s) =>
    //         s.protocol === evt.operation.protocol &&
    //         s.controller.name === evt.operation.controller.name &&
    //         s.function.name === evt.operation.function.name,
    //     );
    //   setSelections(selections.filter((s) => s !== target));
    // });
    setTokenUsage(JSON.parse(JSON.stringify(agent.getTokenUsage())));
  }, []);

  const handleKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      await conversate();
    }
  };

  const conversate = async () => {
    setText("");
    setEnabled(false);
    await agent.conversate(text);

    setEnabled(true);
    setHistories(agent.getPromptHistories().slice());
    setTokenUsage(JSON.parse(JSON.stringify(agent.getTokenUsage())));

    const selections: INestiaAgentOperationSelection[] = agent
      .getPromptHistories()
      .filter((h) => h.type === "select")
      .map((h) => h.operations)
      .flat();
    for (const cancel of agent
      .getPromptHistories()
      .filter((h) => h.type === "cancel")
      .map((h) => h.operations)
      .flat()) {
      const index: number = selections.findIndex(
        (s) =>
          s.protocol === cancel.protocol &&
          s.controller.name === cancel.controller.name &&
          s.function.name === cancel.function.name,
      );
      if (index !== -1) selections.splice(index, 1);
    }
    setSelections(selections);
  };

  return (
    <React.Fragment>
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h5"> Nestia A.I. Chatbot </Typography>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Container
            maxWidth={false}
            style={{
              paddingBottom: 50,
              overflowY: "scroll",
              height: "calc(100vh - 130px)",
              backgroundColor: "skyblue",
            }}
          >
            {histories
              .map((prompt) => <NestiaChatMessageMovie prompt={prompt} />)
              .filter((elem) => elem !== null)}
          </Container>
        </Grid>
        <Grid item xs={4}>
          <NestiaChatSideMovie usage={tokenUsage} selections={selections} />
        </Grid>
      </Grid>
      <AppBar
        position="relative"
        color="inherit"
        style={{ top: "auto", bottom: 0 }}
      >
        <Toolbar>
          <Input
            id="conversate_input"
            fullWidth
            placeholder="Conversate with A.I. Chatbot"
            value={text}
            multiline={true}
            onKeyUp={handleKeyUp}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            variant="contained"
            style={{ marginLeft: 10 }}
            startIcon={<SendIcon />}
            disabled={!enabled}
            onClick={conversate}
          >
            Send
          </Button>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
};
export namespace NestiaChatMovie {
  export interface IProps {
    agent: NestiaAgent;
  }
}
