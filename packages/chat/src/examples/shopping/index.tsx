import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Link,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { IHttpConnection } from "@samchon/openapi";
import ShoppingApi from "@samchon/shopping-api";
import OpenAI from "openai";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import { ShoppingChatApplication } from "./ShoppingChatApplication";

const Application = () => {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");

  const [locale, setLocale] = useState(window.navigator.language);
  const [name, setName] = useState("John Doe");
  const [mobile, setMobile] = useState("821012345678");

  const [progress, setProgress] = useState(false);
  const [next, setNext] = useState<ShoppingChatApplication.IProps | null>(null);

  const startChatApplication = async () => {
    setProgress(true);

    // HANDLESHAKE WITH SHOPPING BACKEND
    const connection: IHttpConnection = {
      host: "https://shopping-be.wrtn.ai",
    };
    await ShoppingApi.functional.shoppings.customers.authenticate.create(
      connection,
      {
        channel_code: "samchon",
        external_user: null,
        href: window.location.href,
        referrer: window.document.referrer,
      },
    );
    await ShoppingApi.functional.shoppings.customers.authenticate.activate(
      connection,
      {
        mobile,
        name,
      },
    );

    // ADVANCE TO THE NEXT STEP
    setNext({
      api: new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      }),
      connection,
      name,
      mobile,
      locale,
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: next !== null ? undefined : "auto",
      }}
    >
      {next !== null ? (
        <ShoppingChatApplication {...next} />
      ) : (
        <FormControl
          style={{
            width: "calc(100% - 60px)",
            padding: 15,
            margin: 15,
          }}
        >
          <Typography variant="h4">Shopping A.I. Chatbot</Typography>
          <br />
          <Divider />
          <br />
          Demonstration of Nestia A.I. Chatbot with Shopping Backend API.
          <br />
          <br />
          <Link
            href="https://github.com/samchon/shopping-backend"
            target="_blank"
          >
            https://github.com/samchon/shopping-backend
          </Link>
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
          <TextField
            onChange={(e) => setName(e.target.value)}
            defaultValue={name}
            label="Name"
            variant="outlined"
            error={name.length === 0}
          />
          <br />
          <TextField
            onChange={(e) => setMobile(e.target.value)}
            defaultValue={mobile}
            label="Mobile"
            variant="outlined"
            error={mobile.length === 0}
          />
          <br />
          <br />
          <Button
            component="a"
            fullWidth
            variant="contained"
            color={"info"}
            size="large"
            disabled={
              progress ||
              apiKey.length === 0 ||
              locale.length === 0 ||
              name.length === 0 ||
              mobile.length === 0
            }
            onClick={() => startChatApplication()}
          >
            {progress ? "Starting..." : "Start A.I. Chatbot"}
          </Button>
        </FormControl>
      )}
    </div>
  );
};

createRoot(window.document.getElementById("root")!).render(<Application />);
