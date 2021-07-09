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
    firstClickedMarble: { rowIdx: -1, colIdx: -1, color: "" },
    secondClickedMarble: { rowIdx: -1, colIdx: -1, color: "" },
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
    } else if (boardState === "switchMarbles") {
      switchSelectedMarbles();
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

  function handleClick(marble: IMarble) {
    const rowIdx = marble.rowIdx;
    const colIdx = marble.colIdx;
    const isFirstClick = clickedMarbles.firstClickedMarble.color === "";
    const isSecondClick =
      !!clickedMarbles.firstClickedMarble.color &&
      clickedMarbles.secondClickedMarble.color === "";

    const newBoardComposition = JSON.parse(JSON.stringify(boardComposition));
    const justClickedMarble = newBoardComposition[rowIdx][colIdx];
    if (isFirstClick) {
      justClickedMarble.isClicked = true;
      setBoardComposition(newBoardComposition);
      setClickedMarbles({
        ...clickedMarbles,
        firstClickedMarble: justClickedMarble,
      });
    } else if (isSecondClick) {
      const isValid = areNeighbors(
        clickedMarbles.firstClickedMarble,
        justClickedMarble
      );

      if (isValid) {
        justClickedMarble.isClicked = true;
        setBoardComposition(newBoardComposition);
        setClickedMarbles({
          ...clickedMarbles,
          secondClickedMarble: justClickedMarble,
        });
        setBoardState("switchMarbles");
      }
    }
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

    firstMarble.isClicked = false;
    secondMarble.isClicked = false;

    setClickedMarbles({
      firstClickedMarble: { rowIdx: -1, colIdx: -1, color: "" },
      secondClickedMarble: { rowIdx: -1, colIdx: -1, color: "" },
    });
    setBoardComposition(newBoardComposition);
    setBoardState("loaded");
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
    col: number,
    row: number,
    boardComposition: IMarble[][]
  ) {
    const [leftOff, rightOff, topOff, bottomOff] = setTheOffset(col, row);
    const marbleColor = boardComposition[row][col].color;
    // check for the solution from left to right
    let horizontalSolution: { col: number; row: number }[] = [];
    for (let i = leftOff; i <= rightOff; i++) {
      if (boardComposition[row][i].color === marbleColor) {
        horizontalSolution.push({
          col: i,
          row: row,
        });
      } else if (horizontalSolution.length >= solutionLength) {
        // because there is no chance to get another solution
        break;
      } else {
        horizontalSolution = [];
      }
    }

    let verticalSolution: { col: number; row: number }[] = [];
    for (let i = topOff; i <= bottomOff; i++) {
      if (boardComposition[i][col].color === marbleColor) {
        verticalSolution.push({
          col: col,
          row: i,
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
};

export default Board;
