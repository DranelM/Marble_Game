import { FunctionComponent } from "react";

interface IProps {
  score?: number;
}

const ScoreBoard: FunctionComponent<IProps> = (props) => {
  const { score } = props;
  return <div className="scoreBoard">Score: {score}</div>;
};

export default ScoreBoard;
