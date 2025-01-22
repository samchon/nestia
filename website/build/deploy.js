import cp from "child_process";
import deploy from "gh-pages";

cp.execSync("npm run build", { stdio: "inherit" });

deploy.publish(
  "out",
  {
    branch: "gh-pages",
    dotfiles: true,
  },
  (err) => {
    if (err) {
      console.log(err);
      process.exit(-1);
    } else clear();
  },
);
