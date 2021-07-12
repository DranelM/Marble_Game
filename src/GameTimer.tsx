import { FunctionComponent } from "react";

interface IProps {
  seconds?: number;
}

const GameTimer: FunctionComponent<IProps> = (props) => {
  const { seconds } = props;
  return <div className="gameTimer">Time left: {seconds} sec</div>;
};

export default GameTimer;
