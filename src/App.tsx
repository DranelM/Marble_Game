import { FunctionComponent, StrictMode } from "react";
import { render } from "react-dom";
import Board from "./Board";

const App = () => {
  return <Board boardSize={5} />;
};

render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
