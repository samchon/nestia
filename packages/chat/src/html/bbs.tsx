import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { NestiaAgent } from "@nestia/agent";
import OpenAI from "openai";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import typia from "typia";

import { NestiaChatApplication } from "../applications/NestiaChatApplication";
import { BbsArticleService } from "../services/BbsArticleService";

function BbsChatApplication() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [locale, setLocale] = useState(window.navigator.language);

  const [agent, setAgent] = useState<NestiaAgent | null>(null);

  const startChatApplication = (): void => {
    const service: BbsArticleService = new BbsArticleService();
    const agent: NestiaAgent = new NestiaAgent({
      provider: {
        type: "chatgpt",
        api: new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true,
        }),
        model: "gpt-4o-mini",
      },
      controllers: [
        {
          protocol: "class",
          name: "bbs",
          application: typia.llm.applicationOfValidate<
            BbsArticleService,
            "chatgpt"
          >(),
          execute: async (props) => {
            return (service as any)[props.function.name](props.arguments);
          },
        },
      ],
      config: {
        locale,
      },
    });
    setAgent(agent);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: agent ? undefined : "auto",
      }}
    >
      {agent ? (
        <NestiaChatApplication agent={agent} />
      ) : (
        <FormControl
          style={{
            width: "calc(100% - 60px)",
            padding: 15,
            margin: 15,
          }}
        >
          <Typography variant="h6">BBS A.I. Chatbot</Typography>
          <br />
          <Divider />
          <br />
          Demonstration of Nestia A.I. Chatbot with TypeScript Controller Class.
          <br />
          <br />
          <Typography variant="h6"> OpenAI Configuration </Typography>
          <TextField
            onChange={(e) => setApiKey(e.target.value)}
            defaultValue={apiKey}
            label="OpenAI API Key"
            variant="outlined"
            placeholder="Your OpenAI API Key"
            error={apiKey.length === 0}
          />
          <br />
          <RadioGroup
            defaultValue={model}
            onChange={(_e, value) => setModel(value)}
            style={{ paddingLeft: 15 }}
          >
            <FormControlLabel
              control={<Radio />}
              label="GPT-4o Mini"
              value="gpt-4o-mini"
            />
            <FormControlLabel
              control={<Radio />}
              label="GPT-4o"
              value="gpt-4o"
            />
          </RadioGroup>
          <br />
          <Typography variant="h6"> Membership Information </Typography>
          <br />
          <TextField
            onChange={(e) => setLocale(e.target.value)}
            defaultValue={locale}
            label="Locale"
            variant="outlined"
            error={locale.length === 0}
          />
          <br />
          <br />
          <Button
            component="a"
            fullWidth
            variant="contained"
            color={"info"}
            size="large"
            disabled={apiKey.length === 0 || locale.length === 0}
            onClick={() => startChatApplication()}
          >
            Start A.I. Chatbot
          </Button>
        </FormControl>
      )}
    </div>
  );
}

const main = async (): Promise<void> => {
  createRoot(window.document.getElementById("root")!).render(
    <BbsChatApplication />,
  );
};
main().catch(console.error);
