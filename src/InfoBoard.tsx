import { FunctionComponent } from "react";
import GameTimer from "./GameTimer";
import ScoreBoard from "./ScoreBoard";

interface IProps {
  score: number;
  timeLeft: number;
}

const InfoBoard: FunctionComponent<IProps> = (props) => {
  const { score, timeLeft } = props;

  return (
    <div className="infoBoard">
      <ScoreBoard score={score} />
      <GameTimer seconds={timeLeft} />
    </div>
  );
};

export default InfoBoard;
