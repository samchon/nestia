import {
  Box,
  CardActionArea,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { useState } from "react";

const HomeStrengthSectionMovie = (props: HomeStrengthSectionMovie.Props) => {
  const [over, setOver] = useState(false);
  return (
    <Grid item xs={12} md={6} lg={4}>
      <Box>
        <CardActionArea
          href={props.href}
          onMouseOver={() => setOver(true)}
          onMouseOut={() => setOver(false)}
        >
          <br />
          <div
            style={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
            }}
          >
            <Box
              component="img"
              src={props.image}
              sx={{
                width: props.width,
                height: props.height ?? 100,
              }}
            />
          </div>
          <br />
          <CardContent style={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                textDecoration: over ? "underline" : undefined,
              }}
            >
              {props.title}
            </Typography>
            <Typography
              color="default"
              sx={{
                paddingTop: 0.5,
              }}
            >
              {props.subTitle}
            </Typography>
            <br />
            {props.description}
          </CardContent>
        </CardActionArea>
        <Divider />
      </Box>
    </Grid>
  );
};
namespace HomeStrengthSectionMovie {
  export interface Props {
    title: string | JSX.Element;
    subTitle: string | JSX.Element;
    description: JSX.Element;
    image: string;
    href: string;
    width?: number;
    height?: number;
  }
}
export default HomeStrengthSectionMovie;
