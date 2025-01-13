import { AddAPhoto } from "@mui/icons-material";
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
import {
  INestiaAgentOperationSelection,
  INestiaAgentPrompt,
  NestiaAgent,
} from "@nestia/agent";
import html2canvas from "html2canvas";
import fileDownload from "js-file-download";
import { useEffect, useRef, useState } from "react";
import React from "react";

import { NestiaChatMessageMovie } from "./messages/NestiaChatMessageMovie";
import { NestiaChatSideMovie } from "./sides/NestiaChatSideMovie";

export const NestiaChatMovie = ({ agent }: NestiaChatMovie.IProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState("");
  const [histories, setHistories] = useState(agent.getPromptHistories());
  const [tokenUsage, setTokenUsage] = useState(agent.getTokenUsage());

  const [enabled, setEnabled] = useState(true);
  const [selections, setSelections] = useState<
    INestiaAgentOperationSelection[]
  >([]);

  const getHistories = () => histories;
  const getSelections = () => selections;

  useEffect(() => {
    (
      document.getElementById("conversate_input") as
        | HTMLInputElement
        | undefined
    )?.select();
    agent.on("text", async (evt) => setHistories([...getHistories(), evt]));
    agent.on("describe", async (evt) => setHistories([...getHistories(), evt]));
    agent.on("select", async (evt) => {
      setHistories([
        ...getHistories(),
        {
          type: "select",
          id: "something",
          operations: [
            {
              ...evt.operation,
              reason: evt.reason,
              toJSON: () => ({}) as any,
            } satisfies INestiaAgentOperationSelection,
          ],
        } satisfies INestiaAgentPrompt.ISelect,
      ]);
      setSelections([
        ...getSelections(),
        {
          ...evt.operation,
          reason: evt.reason,
          toJSON: () => ({}) as any,
        } satisfies INestiaAgentOperationSelection,
      ]);
    });
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

  const capture = async () => {
    if (bodyRef.current === null) return;

    // const cloned = bodyRef.current.cloneNode(true) as HTMLDivElement;
    // document.body.appendChild(cloned);

    const canvas: HTMLCanvasElement = await html2canvas(bodyRef.current, {
      scrollX: 0,
      scrollY: 0,
      width: bodyRef.current.scrollWidth,
      height: bodyRef.current.scrollHeight,
      useCORS: true,
    });
    canvas.toBlob((blob) => {
      if (blob === null) return;
      fileDownload(blob, "nestia-chat-screenshot.png");
      // document.body.removeChild(cloned);
    });
  };

  return (
    <React.Fragment>
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Nestia A.I. Chatbot
          </Typography>
          <Button color="inherit" startIcon={<AddAPhoto />} onClick={capture}>
            Capture
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={0}>
        <Grid item xs={7} id="chatbot-left-grid">
          <div
            style={{
              paddingBottom: 50,
              overflowY: "scroll",
              height: "calc(100vh - 182px)",
              backgroundColor: "lightblue",
            }}
          >
            <Container
              ref={bodyRef}
              id="chat-body-container"
              maxWidth={false}
              style={{
                backgroundColor: "lightblue",
                marginBottom: 15,
              }}
            >
              {histories
                .map((prompt) => <NestiaChatMessageMovie prompt={prompt} />)
                .filter((elem) => elem !== null)}
            </Container>
          </div>
        </Grid>
        <Grid item xs={5}>
          <Container
            maxWidth={false}
            style={{
              paddingBottom: 50,
              overflowY: "scroll",
              height: "calc(100vh - 130px)",
              backgroundColor: "#eeeeee",
            }}
          >
            <NestiaChatSideMovie
              provider={agent.getProvider()}
              usage={tokenUsage}
              selections={selections}
            />
          </Container>
        </Grid>
      </Grid>
      <AppBar position="static" component="div" color="inherit">
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
