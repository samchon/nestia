import { Box, Container, Grid, Typography } from "@mui/material";

import HomeCodeHighlight from "../../components/home/HomeCodeHighlight";

const SIMULATE_CODE = `import api from "@my/api";
import { IBbsArticle } from "@my/api/lib/structures/IBbsArticle";

// just set simulate: true — no backend needed
const connection: api.IConnection = {
  host: "http://localhost:3000",
  simulate: true,
};

// same SDK function, but runs locally
// validates input with typia.assert<T>()
// returns random data with typia.random<T>()
const article: IBbsArticle =
  await api.functional.bbs.articles.create(
    connection,
    "general",
    {
      title: "Hello World",
      body: "My first article",
      thumbnail: "https://example.com/img.png",
    } satisfies IBbsArticle.ICreate,
  );`;

const callouts = [
  {
    icon: "✅",
    title: "Input Validation",
    desc: "Every request parameter is validated with typia.assert<T>(). Type errors are caught instantly, even without a running server.",
  },
  {
    icon: "🎲",
    title: "Random Response",
    desc: "Generates realistic mock responses with typia.random<T>(). Respects type constraints, formats, and custom tags.",
  },
  {
    icon: "⚡",
    title: "Frontend First",
    desc: "Start frontend development immediately. No need to wait for backend implementation — the simulator covers the full API surface.",
  },
  {
    icon: "🔄",
    title: "Seamless Switch",
    desc: "Just remove simulate: true to connect to the real backend. Same code, same types, zero migration effort.",
  },
];

const HomeAiMovie = () => (
  <Box sx={{ py: { xs: 6, md: 10 } }}>
    <Container maxWidth="lg">
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.6rem", md: "2.2rem" },
            mb: 2,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Mockup Simulator
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "1.05rem",
            maxWidth: 700,
            mx: "auto",
          }}
        >
          SDK-embedded simulator that mimics your backend API.
          <br />
          Just set <code>simulate: true</code> — no server required.
        </Typography>
      </Box>
      <Grid container spacing={4} alignItems="stretch">
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              height: "100%",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 1,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  backgroundColor: "rgba(0,180,255,0.6)",
                  color: "#fff",
                }}
              >
                Simulate
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}
              >
                Frontend without Backend
              </Typography>
            </Box>
            <Box
              component="pre"
              sx={{
                p: 2.5,
                m: 0,
                overflow: "auto",
                fontSize: { xs: "0.72rem", md: "0.8rem" },
                lineHeight: 1.7,
                fontFamily:
                  "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.85)",
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 3,
                },
              }}
            >
              <code>
                <HomeCodeHighlight>{SIMULATE_CODE}</HomeCodeHighlight>
              </code>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              height: "100%",
              justifyContent: "center",
            }}
          >
            {callouts.map((c) => (
              <Box
                key={c.title}
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                <Typography sx={{ fontSize: "1.4rem" }}>{c.icon}</Typography>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      mb: 0.3,
                      color: "rgba(255,255,255,0.95)",
                    }}
                  >
                    {c.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.82rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {c.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Container>
  </Box>
);
export default HomeAiMovie;
