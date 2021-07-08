import { FunctionComponent, useEffect, useState } from "react";
import Cell from "./Cell";

interface IProps {
  boardSize: number;
  solutionLength: number;
}

const MARBLECOLORCLASSES = ["", "blueMarble", "pinkMarble", "orangeMarble"];

const Board: FunctionComponent<IProps> = (props) => {
  const { boardSize, solutionLength } = props;
  const [clickedCells, setClickedCells] = useState({
    firstClickedCell: {},
    secondClickedCell: {},
  });

  const [boardComposition, setBoardComposition] = useState(
    [...Array(boardSize).keys()].map((rowIdx) => {
      return [...Array(boardSize).keys()].map((colIdx) => {
        return "";
      });
    })
  );
  const [boardState, setBoardState] = useState("unloaded");

  useEffect(() => {
    if (boardState === "unloaded") {
      let newBoardComposition = createProperlyShuffledBoard();
      setBoardComposition((boardComposition) => newBoardComposition);
      setBoardState("loaded");
    } else if (boardState === "loaded") {
      console.log("Board is loaded");
    } else if (boardState === "toCheck") {
    }
  }, [boardComposition]);

  return <div className="board">{renderBoard()}</div>;

  // --------------- Functions --------------------------

  function renderBoard() {
    return boardComposition.map((row, rowIdx) => renderRow(row, rowIdx));
  }

  function renderRow(row: string[], rowIdx: number) {
    return (
      <div className="row" key={rowIdx}>
        {row.map((cellContent: string, colIdx: number) => {
          return (
            <Cell
              key={colIdx}
              col={colIdx}
              row={rowIdx}
              color={cellContent}
              onClick={() => handleClick(rowIdx, colIdx, cellContent)}
            />
          );
        })}
      </div>
    );
  }

  function handleClick(rowIdx: number, colIdx: number, cellContent: string) {
    const isFirstClick =
      Object.keys(clickedCells.firstClickedCell).length === 0;
    const isSecondClick =
      Object.keys(clickedCells.firstClickedCell).length > 0 &&
      Object.keys(clickedCells.secondClickedCell).length === 0;

    if (isFirstClick) {
      setClickedCells({
        ...clickedCells,
        firstClickedCell: { row: rowIdx, col: colIdx, color: cellContent },
      });
    } else if (isSecondClick) {
      setClickedCells({
        ...clickedCells,
        secondClickedCell: { row: rowIdx, col: colIdx, color: cellContent },
      });
    } else {
      switchSelectedCells();
    }
  }

  function switchSelectedCells() {
    console.log(clickedCells);
    const newBoardComposition = JSON.parse(JSON.stringify(boardComposition));
    newBoardComposition[0][0] = MARBLECOLORCLASSES[2];
    setBoardComposition(newBoardComposition);
  }

  function createProperlyShuffledBoard() {
    let boardCompositionCopy = JSON.parse(JSON.stringify(boardComposition));
    let isValid;
    do {
      boardCompositionCopy.map((row: string[], rowIdx: number) =>
        row.map((cellContent: string, colIdx: number) => {
          let randomColor, horizontalSolution, verticalSolution;
          let possibleColors = [...MARBLECOLORCLASSES.slice(1)];
          do {
            randomColor =
              possibleColors[Math.floor(Math.random() * possibleColors.length)];
            possibleColors.splice(possibleColors.indexOf(randomColor), 1);
            boardCompositionCopy[rowIdx][colIdx] = randomColor;
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

  function isWholeBoardFilled(boardComposition: string[][]) {
    return boardComposition.reduce((acc: boolean, cur: string[]) => {
      return (
        acc &&
        cur.reduce((acc, cur) => {
          return acc && cur !== "";
        }, true)
      );
    }, true);
  }

  function checkForSolution(
    col: number,
    row: number,
    boardComposition: string[][]
  ) {
    const [leftOff, rightOff, topOff, bottomOff] = setTheOffset(col, row);
    const cellColor = boardComposition[row][col];
    // check for the solution from left to right
    let horizontalSolution: { col: number; row: number }[] = [];
    for (let i = leftOff; i <= rightOff; i++) {
      if (boardComposition[row][i] === cellColor) {
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
      if (boardComposition[i][col] === cellColor) {
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
