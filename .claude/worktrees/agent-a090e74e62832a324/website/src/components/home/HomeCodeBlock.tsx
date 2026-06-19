const HomeCodeBlock = (props: {
  children: React.ReactNode;
}) => (
  <span style={{ 
    color: "white", 
    backgroundColor: "gray",
  }}>
    {props.children}
  </span>
);
export default HomeCodeBlock;
