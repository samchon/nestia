import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { INestiaChatTokenUsage } from "@nestia/agent";

export const NestiaChatTokenUsageMovie = (
  props: NestiaChatTokenUsageMovie.IProps,
) => {
  const price: IPrice = compute(props.usage);
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>Token Usage</TableCell>
          <TableCell>Price</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>{props.usage.total.toLocaleString()}</TableCell>
          <TableCell>${price.total.toLocaleString()}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Prompt</TableCell>
          <TableCell>{props.usage.prompt.total.toLocaleString()}</TableCell>
          <TableCell>${price.prompt.toLocaleString()}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Completion</TableCell>
          <TableCell>{props.usage.completion.total.toLocaleString()}</TableCell>
          <TableCell>${price.completion.toLocaleString()}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
export namespace NestiaChatTokenUsageMovie {
  export interface IProps {
    usage: INestiaChatTokenUsage;
  }
}

interface IPrice {
  total: number;
  prompt: number;
  completion: number;
}

const compute = (usage: INestiaChatTokenUsage): IPrice => {
  const prompt: number =
    (usage.prompt.total - usage.prompt.cached) * (2.5 / 1_000_000) +
    usage.prompt.cached * (1.25 / 1_000_000);
  const completion: number = usage.completion.total * (10.0 / 1_000_000);
  return {
    total: prompt + completion,
    prompt,
    completion,
  };
};
