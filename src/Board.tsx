import { FunctionComponent, useEffect, useState } from "react";
import GameTimer from "./GameTimer";
import InfoBoard from "./InfoBoard";
import Marble from "./Marble";
import Modal from "./Modal";
import ScoreBoard from "./ScoreBoard";

interface IProps {
  boardSize: number;
  solutionLength: number;
  timeOfPlay: number;
}

interface IMarble {
  rowIdx: number;
  colIdx: number;
  color: string;
  isClicked?: boolean;
}

const MARBLECOLORCLASSES = ["", "blueMarble", "pinkMarble", "orangeMarble"];
const POINTSPENALTY = 5;

let gameTimer: NodeJS.Timer;

const Board: FunctionComponent<IProps> = (props) => {
  const { boardSize, solutionLength, timeOfPlay } = props;
  const [clickedMarbles, setClickedMarbles] = useState({
    firstClickedMarble: { rowIdx: -1, colIdx: -1, color: "", isClicked: false },
    secondClickedMarble: {
      rowIdx: -1,
      colIdx: -1,
      color: "",
      isClicked: false,
    },
  });

  const [showEndModal, setShowEndModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [gameOn, setGameOn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeOfPlay);
  const [score, setScore] = useState(0);
  const [boardState, setBoardState] = useState("unloaded");
  const [poppedMarbles, setPoppedMarbles] = useState<IMarble[]>([]);
  const [isBoardReadyToPop, setIsBoardReadyToPop] = useState(false);
  const [boardComposition, setBoardComposition] = useState(
    [...Array(boardSize).keys()].map((rowIdx) => {
      return [...Array(boardSize).keys()].map((colIdx) => {
        return { rowIdx: rowIdx, colIdx: colIdx, color: "", isClicked: false };
      });
    })
  );

  useEffect(() => {
    if (gameOn) {
      if (!showInfoModal) {
        gameTimer = setInterval(() => {
          setTimeLeft((timeLeft) => timeLeft - 1);
        }, 1000);
      } else {
        clearInterval(gameTimer);
      }
    } else {
      setTimeLeft(timeOfPlay);
      setScore(0);
      resetClickedMarbles();
      setBoardState("unloaded");
    }
  }, [gameOn, showInfoModal]);

  useEffect(() => {
    if (gameOn && timeLeft === 0) {
      clearInterval(gameTimer);
      setShowEndModal(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (isBoardReadyToPop) {
      setBoardState("popReadyToPopMarbles");
    }
  }, [isBoardReadyToPop]);

  useEffect(() => {
    let newBoardComposition = JSON.parse(JSON.stringify(boardComposition));

    if (boardState === "unloaded") {
      newBoardComposition = createProperlyShuffledBoard();
      setBoardComposition(newBoardComposition);
      setBoardState("loaded");
    } else if (["firstClick", "secondClick"].includes(boardState)) {
      /* if first click of the game start timer */
      if (!gameOn) {
        setGameOn(true);
        // TODO store score in some database
      }

      if (boardState === "firstClick") {
        const rowIdx = clickedMarbles.firstClickedMarble.rowIdx;
        const colIdx = clickedMarbles.firstClickedMarble.colIdx;
        newBoardComposition[rowIdx][colIdx].isClicked = true;
      } else if (boardState === "secondClick") {
        const rowIdx = clickedMarbles.secondClickedMarble.rowIdx;
        const colIdx = clickedMarbles.secondClickedMarble.colIdx;

        const areClicksNeighbors = areNeighbors(
          clickedMarbles.firstClickedMarble,
          clickedMarbles.secondClickedMarble
        );

        const isFirstMarbleDoubleClicked = areSame(
          clickedMarbles.secondClickedMarble,
          clickedMarbles.firstClickedMarble
        );

        if (areClicksNeighbors) {
          newBoardComposition[rowIdx][colIdx].isClicked = true;
          setBoardState("switchClickedMarbles");
        } else if (isFirstMarbleDoubleClicked) {
          newBoardComposition[rowIdx][colIdx].isClicked = false;
          resetClickedMarbles();
        } else {
          // if the second click is neither neigbor nor same as first one - aka mistake
          setClickedMarbles({
            ...clickedMarbles,
            secondClickedMarble: {
              rowIdx: -1,
              colIdx: -1,
              color: "",
              isClicked: false,
            },
          });
          setBoardState("clickMistake");
        }
      }
      setBoardComposition(newBoardComposition);
    } else if (boardState === "switchClickedMarbles") {
      newBoardComposition = switchSelectedMarbles(
        clickedMarbles.firstClickedMarble,
        clickedMarbles.secondClickedMarble,
        newBoardComposition
      );

      const firstMarble =
        newBoardComposition[clickedMarbles.firstClickedMarble.rowIdx][
          clickedMarbles.firstClickedMarble.colIdx
        ];

      const secondMarble =
        newBoardComposition[clickedMarbles.secondClickedMarble.rowIdx][
          clickedMarbles.secondClickedMarble.colIdx
        ];

      firstMarble.isClicked = false;
      secondMarble.isClicked = false;

      resetClickedMarbles();
      setBoardComposition(newBoardComposition);

      const isReadyToPopMarbles =
        findReadyToPopWholeBoard(newBoardComposition).length > 0;

      // If player switches marbles without pop he loses points
      if (!isReadyToPopMarbles) {
        setScore((score) => score - POINTSPENALTY);
      }

      setIsBoardReadyToPop(isReadyToPopMarbles);
    } else if (boardState === "popReadyToPopMarbles") {
      let readyToPop = findReadyToPopWholeBoard(newBoardComposition);
      newBoardComposition = popMarbles(readyToPop, newBoardComposition);

      setScore((score) => score + readyToPop.length);
      setPoppedMarbles(readyToPop);
      setBoardComposition(newBoardComposition);
      setBoardState("refillHighestEmptyLayer");
    } else if (boardState === "refillHighestEmptyLayer") {
      let closestToTopPops = [];

      closestToTopPops = getClosestToTopPops(poppedMarbles);
      newBoardComposition = refillClosestToTopPops(
        closestToTopPops,
        newBoardComposition
      );
      const partiallyFilledPoppedMarbles = removeFilledPositions(
        poppedMarbles,
        closestToTopPops
      );

      setPoppedMarbles(partiallyFilledPoppedMarbles);
      setBoardComposition(newBoardComposition);
      setIsBoardReadyToPop(
        findReadyToPopWholeBoard(newBoardComposition).length > 0
      );
      setBoardState("checkIfBoardRefilled");
    } else if (boardState === "checkIfBoardRefilled") {
      if (poppedMarbles.length > 0) {
        setBoardState("refillHighestEmptyLayer");
      } else if (isBoardReadyToPop) {
        setBoardState("popReadyToPopMarbles");
      } else {
        setBoardState("boardFullyRefilled");
      }
    }
  }, [boardState]);

  // --------------- Functions --------------------------

  function renderBoard() {
    return boardComposition.map((row, rowIdx) => renderRow(row, rowIdx));
  }

  function renderRow(row: IMarble[], rowIdx: number) {
    return (
      <div className="row" key={rowIdx}>
        {row.map((marble: IMarble, colIdx: number) => {
          return (
            <div className="cellBox" key={hashPositionKey(marble)}>
              <Marble
                key={hashPositionKey(marble)}
                col={marble.colIdx}
                row={marble.rowIdx}
                color={marble.color}
                onClick={() => handleMarbleClick(marble)}
                isClicked={marble.isClicked}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function createProperlyShuffledBoard() {
    let boardCompositionCopy = JSON.parse(JSON.stringify(boardComposition));
    let isValid;
    do {
      boardCompositionCopy.map((row: IMarble[], rowIdx: number) =>
        row.map((marble: IMarble, colIdx: number) => {
          let randomColor, readyToPop;
          let possibleColors = [...MARBLECOLORCLASSES.slice(1)];
          do {
            randomColor = generateNewMarbleColor(possibleColors);
            possibleColors.splice(possibleColors.indexOf(randomColor), 1);

            boardCompositionCopy[rowIdx][colIdx].color = randomColor;
            boardCompositionCopy[rowIdx][colIdx].isClicked = false;

            readyToPop = findReadyToPopByPositions(
              JSON.parse(JSON.stringify(boardCompositionCopy)),
              marble
            );
            if (!possibleColors.length) {
              return "";
            }
          } while (readyToPop.length);

          return randomColor;
        })
      );

      isValid = isWholeBoardFilled(boardCompositionCopy);
    } while (!isValid);

    return boardCompositionCopy;
  }

  function isWholeBoardFilled(boardComposition: IMarble[][]) {
    return boardComposition.reduce((acc: boolean, cur: IMarble[]) => {
      return (
        acc &&
        cur.reduce((acc, cur) => {
          return acc && cur.color !== "";
        }, true)
      );
    }, true);
  }

  function findReadyToPopByPositions(
    boardComposition: IMarble[][],
    ...args: IMarble[]
  ): IMarble[] {
    let readyToPop: { rowIdx: number; colIdx: number }[] = [];
    args.forEach((marble) => {
      const rowIdx = marble.rowIdx;
      const colIdx = marble.colIdx;

      const [leftOff, rightOff, topOff, bottomOff] = setTheOffset(
        colIdx,
        rowIdx
      );
      const marbleColor = boardComposition[rowIdx][colIdx].color;
      // check for the solution from left to right
      let horizontalSolution: IMarble[] = [];
      for (let i = leftOff; i <= rightOff; i++) {
        if (boardComposition[rowIdx][i].color === marbleColor) {
          horizontalSolution.push(boardComposition[rowIdx][i]);
        } else if (horizontalSolution.length >= solutionLength) {
          // because there is no chance to get another solution
          break;
        } else {
          horizontalSolution = [];
        }
      }

      let verticalSolution: IMarble[] = [];
      for (let i = topOff; i <= bottomOff; i++) {
        if (boardComposition[i][colIdx].color === marbleColor) {
          verticalSolution.push(boardComposition[i][colIdx]);
        } else if (verticalSolution.length >= solutionLength) {
          // because there is no chance to get another solution
          break;
        } else {
          verticalSolution = [];
        }
      }

      horizontalSolution =
        horizontalSolution.length >= solutionLength ? horizontalSolution : [];
      verticalSolution =
        verticalSolution.length >= solutionLength ? verticalSolution : [];

      horizontalSolution.forEach((marble) => {
        readyToPop[hashPositionKey(marble)] = marble;
      });
      verticalSolution.forEach((marble) => {
        readyToPop[hashPositionKey(marble)] = marble;
      });
    });

    //@ts-ignore
    return readyToPop.reduce((acc, cur) => (!!cur ? acc.concat(cur) : acc), []);
  }

  function hashPositionKey(position: IMarble) {
    return position.rowIdx * boardSize + position.colIdx;
  }

  function setTheOffset(col: number, row: number) {
    let offset = solutionLength - 1;
    let leftSide = -offset;
    while (leftSide < 0) {
      leftSide = col - offset;
      offset -= 1;
    }

    offset = solutionLength - 1;
    let rightSide = col + offset;
    while (rightSide >= boardSize) {
      offset -= 1;
      rightSide = col + offset;
    }

    offset = solutionLength - 1;
    let topSide = -offset;
    while (topSide < 0) {
      topSide = row - offset;
      offset -= 1;
    }

    offset = solutionLength - 1;
    let bottomSide = row + offset;
    while (bottomSide >= boardSize) {
      offset -= 1;
      bottomSide = row + offset;
    }

    return [leftSide, rightSide, topSide, bottomSide];
  }

  function handleMarbleClick(marble: IMarble) {
    const justClickedMarble = JSON.parse(JSON.stringify(marble));
    justClickedMarble.isClicked = true;

    const isFirstClick = !clickedMarbles.firstClickedMarble.isClicked;
    const isSecondClick =
      clickedMarbles.firstClickedMarble.isClicked &&
      !clickedMarbles.secondClickedMarble.isClicked;

    if (isFirstClick) {
      setBoardState("firstClick");
      setClickedMarbles({
        ...clickedMarbles,
        firstClickedMarble: justClickedMarble,
      });
    } else if (isSecondClick) {
      setBoardState("secondClick");
      setClickedMarbles({
        ...clickedMarbles,
        secondClickedMarble: justClickedMarble,
      });
    }
  }

  function handleInfoClick() {
    setShowInfoModal(!showInfoModal);
  }

  function areSame(marble1: IMarble, marble2: IMarble) {
    return (
      marble1.rowIdx === marble2.rowIdx &&
      marble1.colIdx === marble2.colIdx &&
      marble1.color === marble2.color
    );
  }

  function areNeighbors(marble1: IMarble, marble2: IMarble) {
    const marble1Neighbors = getNeighbors(marble1.rowIdx, marble1.colIdx);
    const isANeighborOfFirstMarble = marble1Neighbors.reduce(
      (acc, neighbor) =>
        acc ||
        (neighbor.rowIdx === marble2.rowIdx &&
          neighbor.colIdx === marble2.colIdx),
      false
    );

    return isANeighborOfFirstMarble;
  }

  function getNeighbors(rowIdx: number, colIdx: number) {
    let neighbors = [];
    if (rowIdx - 1 >= 0) {
      neighbors.push({ rowIdx: rowIdx - 1, colIdx: colIdx });
    }
    if (rowIdx + 1 < boardSize) {
      neighbors.push({ rowIdx: rowIdx + 1, colIdx: colIdx });
    }
    if (colIdx - 1 >= 0) {
      neighbors.push({ rowIdx: rowIdx, colIdx: colIdx - 1 });
    }
    if (colIdx + 1 < boardSize) {
      neighbors.push({ rowIdx: rowIdx, colIdx: colIdx + 1 });
    }

    return neighbors;
  }

  function switchSelectedMarbles(
    firstMarble: IMarble,
    secondMarble: IMarble,
    boardComposition: IMarble[][]
  ) {
    const isGrabingNewMarbleFromTop = secondMarble.rowIdx === -1;
    if (isGrabingNewMarbleFromTop) {
      firstMarble = boardComposition[firstMarble.rowIdx][firstMarble.colIdx];
      firstMarble.color = generateNewMarbleColor();
    } else {
      firstMarble = boardComposition[firstMarble.rowIdx][firstMarble.colIdx];
      secondMarble = boardComposition[secondMarble.rowIdx][secondMarble.colIdx];

      [firstMarble.color, secondMarble.color] = [
        secondMarble.color,
        firstMarble.color,
      ];
    }

    return boardComposition;
  }

  function getClosestToTopPops(readyToPop: IMarble[]) {
    let closestToTopLevel = boardSize;
    let closestToTopPops: IMarble[] = [];

    readyToPop.forEach((marble) => {
      if (closestToTopLevel > marble.rowIdx) {
        closestToTopLevel = marble.rowIdx;
        closestToTopPops = [marble];
      } else if (closestToTopLevel === marble.rowIdx) {
        closestToTopPops.push(marble);
      }
    });

    return closestToTopPops;
  }

  function generateNewMarbleColor(possibleColors: string[] = []) {
    possibleColors = possibleColors.length
      ? possibleColors
      : [...MARBLECOLORCLASSES.slice(1)];
    return possibleColors[Math.floor(Math.random() * possibleColors.length)];
  }

  function findReadyToPopWholeBoard(boardComposition: IMarble[][]) {
    let marblesArray = boardComposition.reduce(
      (acc, curr) => acc.concat(...curr),
      []
    );
    const readyToPop = findReadyToPopByPositions(
      boardComposition,
      ...marblesArray
    );

    return readyToPop;
  }

  function resetClickedMarbles() {
    setClickedMarbles({
      firstClickedMarble: {
        rowIdx: -1,
        colIdx: -1,
        color: "",
        isClicked: false,
      },
      secondClickedMarble: {
        rowIdx: -1,
        colIdx: -1,
        color: "",
        isClicked: false,
      },
    });
  }

  function refillClosestToTopPops(
    closestToTopPops: IMarble[],
    boardComposition: IMarble[][]
  ) {
    closestToTopPops.forEach((marble) => {
      // switch marbles to the top until the blank marble will
      // change place with a new marble from outside of the board
      for (let i = 0; i < marble.rowIdx + 1; i++) {
        const bottomMarble = boardComposition[marble.rowIdx - i][marble.colIdx];
        const topMarble =
          marble.rowIdx - i - 1 >= 0
            ? boardComposition[marble.rowIdx - i - 1][marble.colIdx]
            : { rowIdx: -1, colIdx: -1, color: "" };
        boardComposition = switchSelectedMarbles(
          bottomMarble,
          topMarble,
          boardComposition
        );
      }
    });
    return boardComposition;
  }

  function removeFilledPositions(
    newReadyToPop: IMarble[],
    closestToTopPops: IMarble[]
  ) {
    closestToTopPops.forEach((marbleToDelete) => {
      newReadyToPop = newReadyToPop.filter(
        (marble) => !areSame(marble, marbleToDelete)
      );
    });
    return newReadyToPop;
  }

  function popMarbles(readyToPop: IMarble[], boardComposition: IMarble[][]) {
    readyToPop.forEach((position: { rowIdx: number; colIdx: number }) => {
      boardComposition[position.rowIdx][position.colIdx].color = "";
    });
    return boardComposition;
  }

  function saveScore() {
    // TODO
    // debugger;
    // var csv = "nickname,score\n";
  }

  return (
    <>
      <InfoBoard
        score={score}
        timeLeft={timeLeft}
        showInfoModal={showInfoModal}
        handleInfoClick={handleInfoClick}
      />
      <div className="board">{renderBoard()}</div>
      {showEndModal ? (
        <Modal>
          <h1> Game Over </h1>
          <h2>You popped {score} marbles</h2>
          {/* <div className="submitScoreForm">
           <form
              onSubmit={(e) => {
                e.preventDefault();
                // saveScore();
                setShowEndModal(false);
                setGameOn(false);
              }}
            >
              <input
                type="text"
                id="yourNickname"
                placeholder="Enter your nickname"
              />

            </form> 
          </div> */}
          <button
            onClick={(e) => {
              setShowEndModal(false);
              setGameOn(false);
            }}
          >
            Play Again
          </button>
        </Modal>
      ) : null}
    </>
  );
};

export default Board;
