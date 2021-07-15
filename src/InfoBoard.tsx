import { FunctionComponent, useState } from "react";
import GameTimer from "./GameTimer";
import Modal from "./Modal";
import ScoreBoard from "./ScoreBoard";

interface IProps {
  score: number;
  timeLeft: number;
}

const InfoBoard: FunctionComponent<IProps> = (props) => {
  const { score, timeLeft } = props;
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="infoBoard">
      <div
        className="instr-tooltip"
        onClick={() => setShowModal((state) => !state)}
      >
        i
        {showModal ? (
          <Modal>
            <span className="instr-text">
              The game is simple. Replace the adjacent marbles to set 3 of a
              kind in a row or a column. It will make them pop. <br />
              <br /> One marble pop = 1 point. <br /> Replacing the marbles
              without popping = -5 points. <br /> <br /> You have 10 seconds to
              pop as many marbles as you can. <br /> Enjoy!
            </span>
            <button className="instr-button"> Let's POP</button>
          </Modal>
        ) : null}
      </div>
      <ScoreBoard score={score} />
      <GameTimer seconds={timeLeft} />
    </div>
  );
};

export default InfoBoard;
