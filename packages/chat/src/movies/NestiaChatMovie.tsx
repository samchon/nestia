import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import SendIcon from "@mui/icons-material/Send";
import {
  AppBar,
  Button,
  Container,
  Input,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  INestiaAgentOperationSelection,
  INestiaAgentPrompt,
  INestiaAgentTokenUsage,
  NestiaAgent,
} from "@nestia/agent";
import html2canvas from "html2canvas";
import fileDownload from "js-file-download";
import { useEffect, useRef, useState } from "react";
import React from "react";

import { NestiaChatMessageMovie } from "./messages/NestiaChatMessageMovie";
import { NestiaChatSideMovie } from "./sides/NestiaChatSideMovie";

export const NestiaChatMovie = ({ agent }: NestiaChatMovie.IProps) => {
  const upperDivRef = useRef<HTMLDivElement>(null);
  const middleDivRef = useRef<HTMLDivElement>(null);
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [histories, setHistories] = useState<INestiaAgentPrompt[]>(
    agent.getPromptHistories().slice(),
  );
  const [tokenUsage, setTokenUsage] = useState<INestiaAgentTokenUsage>(
    JSON.parse(JSON.stringify(agent.getTokenUsage())),
  );
  const [height, setHeight] = useState(122);
  const [enabled, setEnabled] = useState(true);
  const [selections, setSelections] = useState<
    INestiaAgentOperationSelection[]
  >([]);

  useEffect(() => {
    if (inputRef.current !== null) inputRef.current.select();
    agent.on("text", (evt) => {
      histories.push(evt);
      setHistories(histories);
    });
    agent.on("describe", (evt) => {
      histories.push(evt);
      setHistories(histories);
    });
    agent.on("select", (evt) => {
      histories.push({
        type: "select",
        id: "something",
        operations: [
          {
            ...evt.operation,
            reason: evt.reason,
            toJSON: () => ({}) as any,
          } satisfies INestiaAgentOperationSelection,
        ],
      });
      setHistories(histories);

      selections.push({
        ...evt.operation,
        reason: evt.reason,
        toJSON: () => ({}) as any,
      } satisfies INestiaAgentOperationSelection);
      setSelections(selections);
    });
    setTokenUsage(agent.getTokenUsage());
  }, []);

  const handleKeyUp = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      if (enabled === false) event.preventDefault();
      else await conversate();
    }
  };

  const handleResize = () => {
    setTimeout(() => {
      if (
        upperDivRef.current === null ||
        middleDivRef.current === null ||
        bottomDivRef.current === null
      )
        return;
      const newHeight: number =
        upperDivRef.current.clientHeight + bottomDivRef.current.clientHeight;
      if (newHeight !== height) setHeight(newHeight);
    });
  };

  const conversate = async () => {
    setText("");
    setEnabled(false);
    handleResize();
    await agent.conversate(text);

    histories.splice(0, histories.length);
    histories.push(...agent.getPromptHistories());
    setHistories(histories);
    setTokenUsage(agent.getTokenUsage());
    setEnabled(true);

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
    if (bodyContainerRef.current === null) return;

    const canvas: HTMLCanvasElement = await html2canvas(
      bodyContainerRef.current,
      {
        scrollX: 0,
        scrollY: 0,
        width: bodyContainerRef.current.scrollWidth,
        height: bodyContainerRef.current.scrollHeight,
        useCORS: true,
      },
    );
    canvas.toBlob((blob) => {
      if (blob === null) return;
      fileDownload(blob, "nestia-chat-screenshot.png");
    });
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <AppBar ref={upperDivRef} position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Nestia A.I. Chatbot
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddAPhotoIcon />}
            onClick={capture}
          >
            Screenshot Capture
          </Button>
        </Toolbar>
      </AppBar>
      <div
        ref={middleDivRef}
        style={{
          width: "100%",
          height: `calc(100% - ${height}px)`,
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            paddingBottom: 50,
            width: `calc(100% - ${RIGHT_WIDTH}px)`,
            overflowY: "scroll",
            backgroundColor: "lightblue",
          }}
        >
          <Container
            ref={bodyContainerRef}
            style={{
              marginBottom: 15,
            }}
          >
            {histories
              .map((prompt) => <NestiaChatMessageMovie prompt={prompt} />)
              .filter((elem) => elem !== null)}
          </Container>
        </div>
        <div
          ref={scrollRef}
          style={{
            paddingBottom: 50,
            width: RIGHT_WIDTH,
            overflowY: "auto",
            backgroundColor: "#eeeeee",
          }}
        >
          <Container maxWidth={false}>
            <NestiaChatSideMovie
              provider={agent.getProvider()}
              config={agent.getConfig()}
              usage={tokenUsage}
              selections={selections}
            />
          </Container>
        </div>
      </div>
      <AppBar
        ref={bottomDivRef}
        position="static"
        component="div"
        color="inherit"
      >
        <Toolbar>
          <Input
            inputRef={inputRef}
            fullWidth
            placeholder="Conversate with A.I. Chatbot"
            value={text}
            multiline={true}
            onKeyUp={handleKeyUp}
            onChange={(e) => {
              setText(e.target.value);
              handleResize();
            }}
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
    </div>
  );
};
export namespace NestiaChatMovie {
  export interface IProps {
    agent: NestiaAgent;
  }
}

const RIGHT_WIDTH = 500;
