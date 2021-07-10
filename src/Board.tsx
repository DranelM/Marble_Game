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
    let newBoardComposition = JSON.parse(JSON.stringify(boardComposition));

    if (boardState === "unloaded") {
      newBoardComposition = createProperlyShuffledBoard();
      setBoardComposition((boardComposition) => newBoardComposition);
      setBoardState("loaded");
    } else if (["firstClick", "secondClick"].includes(boardState)) {
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
          setBoardState("switchClickedMarbles");
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
    } else if (boardState === "switchClickedMarbles") {
      // switchSelectedMarbles();
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

      let readyToPop = findReadyToPopByPositions(
        newBoardComposition,
        clickedMarbles.firstClickedMarble,
        clickedMarbles.secondClickedMarble
      );

      do {
        readyToPop.forEach((position: { rowIdx: number; colIdx: number }) => {
          newBoardComposition[position.rowIdx][position.colIdx].color = "";
        });

        setBoardComposition(newBoardComposition);

        let closestToTopPops = [];
        do {
          closestToTopPops = getClosestToTopPops(readyToPop);
          closestToTopPops.forEach((marble) => {
            // switch marbles to the top until the blank marble will
            // change place with a new marble from outside of the board
            for (let i = 0; i < marble.rowIdx + 1; i++) {
              const bottomMarble =
                newBoardComposition[marble.rowIdx - i][marble.colIdx];
              const topMarble =
                marble.rowIdx - i - 1 >= 0
                  ? newBoardComposition[marble.rowIdx - i - 1][marble.colIdx]
                  : { rowIdx: -1, colIdx: -1, color: "" };
              newBoardComposition = switchSelectedMarbles(
                bottomMarble,
                topMarble,
                newBoardComposition
              );
            }
          });

          setBoardComposition(newBoardComposition);

          closestToTopPops.forEach((marbleToDelete) => {
            readyToPop = readyToPop.filter(
              (marble) => !areSame(marble, marbleToDelete)
            );
          });
        } while (readyToPop.length);
        readyToPop = findReadyToPopWholeBoard(newBoardComposition);
        // setBoardState("checkReadyToPopWholeBoard");
      } while (readyToPop.length);
    } else if (boardState === "checkReadyToPopWholeBoard") {
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
        row.map((marble: IMarble, colIdx: number) => {
          let randomColor, readyToPop;
          let possibleColors = [...MARBLECOLORCLASSES.slice(1)];
          do {
            randomColor = generateNewMarbleColor(possibleColors);
            possibleColors.splice(possibleColors.indexOf(randomColor), 1);
            boardCompositionCopy[rowIdx][colIdx].color = randomColor;
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
        readyToPop[hashTheReadyToPopMarble(marble)] = marble;
      });
      verticalSolution.forEach((marble) => {
        readyToPop[hashTheReadyToPopMarble(marble)] = marble;
      });
    });

    //@ts-ignore
    return readyToPop.reduce((acc, cur) => (!!cur ? acc.concat(cur) : acc), []);
  }

  function hashTheReadyToPopMarble(position: IMarble) {
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

  function reFillMarbles() {}

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
};

export default Board;
