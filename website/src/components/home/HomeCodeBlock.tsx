import { PALETTE } from "../../constants/PALETTE";

/**
 * Inline code inside landing copy.
 *
 * Currently unreferenced, but kept in step with the palette: it used to be
 * white-on-gray, which was only legible on the old black site and would have
 * come out as a smear the first time anyone reached for it here.
 */
const HomeCodeBlock = (props: { children: React.ReactNode }) => (
  <span
    style={{
      color: PALETTE.RED_DEEP,
      backgroundColor: PALETTE.SOFT,
      borderRadius: "0.3rem",
      padding: "0.1rem 0.35rem",
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      fontSize: "0.92em",
    }}
  >
    {props.children}
  </span>
);
export default HomeCodeBlock;
