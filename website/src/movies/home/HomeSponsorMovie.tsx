"use client";

import { Box, Container, Typography } from "@mui/material";

import HomeSectionHeading from "../../components/home/HomeSectionHeading";

const HomeSponsorMovie = () => (
  <Box sx={{ py: { xs: 6, md: 10 } }}>
    <Container maxWidth="md">
      <HomeSectionHeading title="Sponsors" maxWidth={550}>
        Thanks for your support. Your donation encourages nestia development.
      </HomeSectionHeading>
      <Box sx={{ textAlign: "center" }}>
        <Box
          component="a"
          href="https://opencollective.com/nestia"
          sx={{ display: "inline-block" }}
        >
          <Box
            component="img"
            src="https://opencollective.com/nestia/badge.svg?avatarHeight=75&width=600"
            alt="Sponsors"
            sx={{
              maxWidth: "100%",
              borderRadius: 2,
            }}
          />
        </Box>
      </Box>
    </Container>
  </Box>
);
export default HomeSponsorMovie;
