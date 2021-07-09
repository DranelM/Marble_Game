import { FunctionComponent, useEffect, useState } from "react";
import Marble from "./Marble";

interface IProps {
  boardSize: number;
  solutionLength: number;
}

interface IMarble {
  rowIdx: number;
  colIdx: number;
  color: string;
  isClicked?: boolean;
}

const MARBLECOLORCLASSES = ["", "blueMarble", "pinkMarble", "orangeMarble"];

const Board: FunctionComponent<IProps> = (props) => {
  const { boardSize, solutionLength } = props;
  const [clickedMarbles, setClickedMarbles] = useState({
    firstClickedMarble: { rowIdx: -1, colIdx: -1, color: "", isClicked: false },
    secondClickedMarble: {
      rowIdx: -1,
      colIdx: -1,
      color: "",
      isClicked: false,
    },
  });

  const [boardComposition, setBoardComposition] = useState(
    [...Array(boardSize).keys()].map((rowIdx) => {
      return [...Array(boardSize).keys()].map((colIdx) => {
        return { rowIdx: rowIdx, colIdx: colIdx, color: "" };
      });
    })
  );
  const [boardState, setBoardState] = useState("unloaded");

  useEffect(() => {
    if (boardState === "unloaded") {
      let newBoardComposition = createProperlyShuffledBoard();
      setBoardComposition((boardComposition) => newBoardComposition);
      setBoardState("loaded");
    } else if (["firstClick", "secondClick"].includes(boardState)) {
      let newBoardComposition = JSON.parse(JSON.stringify(boardComposition));

      if (boardState === "firstClick") {
        const rowIdx = clickedMarbles.firstClickedMarble.rowIdx;
        const colIdx = clickedMarbles.firstClickedMarble.colIdx;
        newBoardComposition[rowIdx][colIdx] = clickedMarbles.firstClickedMarble;
      } else if (boardState === "secondClick") {
        const rowIdx = clickedMarbles.secondClickedMarble.rowIdx;
        const colIdx = clickedMarbles.secondClickedMarble.colIdx;
        newBoardComposition[rowIdx][colIdx] =
          clickedMarbles.secondClickedMarble;

        const areClicksNeighbors = areNeighbors(
          clickedMarbles.firstClickedMarble,
          clickedMarbles.secondClickedMarble
        );

        const isFirstMarbleDoubleClicked = areSame(
          clickedMarbles.secondClickedMarble,
          clickedMarbles.firstClickedMarble
        );

        if (areClicksNeighbors) {
          setBoardState("switchMarbles");
        } else if (isFirstMarbleDoubleClicked) {
          newBoardComposition[rowIdx][colIdx].isClicked = false;
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
        } else {
          // if the second click is neither neigbor nor same as first one - aka mistake
          newBoardComposition = JSON.parse(JSON.stringify(boardComposition));
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
    } else if (boardState === "switchMarbles") {
      switchSelectedMarbles();
    }
  }, [boardState]);

  useEffect(() => {
    if (boardState === "reFillPoppedCherry") {
      reFillMarbles();
    }
  }, [boardComposition]);

  return <div className="board">{renderBoard()}</div>;

  // --------------- Functions --------------------------

  function renderBoard() {
    return boardComposition.map((row, rowIdx) => renderRow(row, rowIdx));
  }

  function renderRow(row: IMarble[], rowIdx: number) {
    return (
      <div className="row" key={rowIdx}>
        {row.map((marble: IMarble, colIdx: number) => {
          return (
            <div className="cellBox" key={colIdx}>
              <Marble
                key={marble.colIdx}
                col={marble.colIdx}
                row={marble.rowIdx}
                color={marble.color}
                onClick={() => handleClick(marble)}
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
        row.map((marbleContent: IMarble, colIdx: number) => {
          let randomColor, horizontalSolution, verticalSolution;
          let possibleColors = [...MARBLECOLORCLASSES.slice(1)];
          do {
            randomColor =
              possibleColors[Math.floor(Math.random() * possibleColors.length)];
            possibleColors.splice(possibleColors.indexOf(randomColor), 1);
            boardCompositionCopy[rowIdx][colIdx].color = randomColor;
            [horizontalSolution, verticalSolution] = checkForSolution(
              colIdx,
              rowIdx,
              JSON.parse(JSON.stringify(boardCompositionCopy))
            );
            if (!possibleColors.length) {
              return "";
            }
          } while (horizontalSolution.length || verticalSolution.length);

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

  function checkForSolution(
    colIdx: number,
    rowIdx: number,
    boardComposition: IMarble[][]
  ) {
    const [leftOff, rightOff, topOff, bottomOff] = setTheOffset(colIdx, rowIdx);
    const marbleColor = boardComposition[rowIdx][colIdx].color;
    // check for the solution from left to right
    let horizontalSolution: { colIdx: number; rowIdx: number }[] = [];
    for (let i = leftOff; i <= rightOff; i++) {
      if (boardComposition[rowIdx][i].color === marbleColor) {
        horizontalSolution.push({
          colIdx: i,
          rowIdx: rowIdx,
        });
      } else if (horizontalSolution.length >= solutionLength) {
        // because there is no chance to get another solution
        break;
      } else {
        horizontalSolution = [];
      }
    }

    let verticalSolution: { colIdx: number; rowIdx: number }[] = [];
    for (let i = topOff; i <= bottomOff; i++) {
      if (boardComposition[i][colIdx].color === marbleColor) {
        verticalSolution.push({
          colIdx: colIdx,
          rowIdx: i,
        });
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

    return [horizontalSolution, verticalSolution];
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

  function handleClick(marble: IMarble) {
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

  function switchSelectedMarbles() {
    const newBoardComposition = JSON.parse(JSON.stringify(boardComposition));

    const firstMarble =
      newBoardComposition[clickedMarbles.firstClickedMarble.rowIdx][
        clickedMarbles.firstClickedMarble.colIdx
      ];

    const secondMarble =
      newBoardComposition[clickedMarbles.secondClickedMarble.rowIdx][
        clickedMarbles.secondClickedMarble.colIdx
      ];

    firstMarble.color = clickedMarbles.secondClickedMarble.color;
    secondMarble.color = clickedMarbles.firstClickedMarble.color;

    const firstMarbleSolutions = checkForSolution(
      firstMarble.colIdx,
      firstMarble.rowIdx,
      newBoardComposition
    );

    const secondMarbleSolutions = checkForSolution(
      secondMarble.colIdx,
      secondMarble.rowIdx,
      newBoardComposition
    );

    let marblesToPop = firstMarbleSolutions
      .reduce((acc, cur) => acc.concat(cur))
      .concat(secondMarbleSolutions.reduce((acc, cur) => acc.concat(cur)));

    marblesToPop.forEach(
      (marblePosition) =>
        (newBoardComposition[marblePosition.rowIdx][
          marblePosition.colIdx
        ].color = "")
    );

    //TODO Calculate Score
    // debugger;

    firstMarble.isClicked = false;
    secondMarble.isClicked = false;

    setBoardState("reFillPoppedCherry");
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
    setBoardComposition(newBoardComposition);
  }

  function reFillMarbles() {}
};

export default Board;
