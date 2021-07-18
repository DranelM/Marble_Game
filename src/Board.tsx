import { FunctionComponent, useEffect, useState } from "react";
import InfoBoard from "./InfoBoard";
import Marble from "./Marble";
import Modal from "./Modal";

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
const MARBLESIZE = Number(
  getComputedStyle(document.documentElement)
    .getPropertyValue("--marble-size")
    .slice(0, -2)
);

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

  const [movementMode, setMovementMode] = useState("click");
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
        return {
          rowIdx: rowIdx,
          colIdx: colIdx,
          color: "",
          isClicked: false,
          hashPosition: hashPositionKey({
            rowIdx: rowIdx,
            colIdx: colIdx,
            color: "",
          }),
        };
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
      resetWholeGame();
    }
  }, [gameOn, showInfoModal]);

  useEffect(() => {
    resetWholeGame();
  }, [movementMode]);

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

          setBoardState("loaded");
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
        setBoardState("loaded");
      }

      setIsBoardReadyToPop(isReadyToPopMarbles);
    } else if (boardState === "popReadyToPopMarbles") {
      let readyToPop = findReadyToPopWholeBoard(newBoardComposition);
      newBoardComposition = popMarbles(readyToPop, newBoardComposition);

      setScore((score) => score + readyToPop.length);
      setPoppedMarbles(readyToPop);
      setBoardComposition(newBoardComposition);
      setBoardState("checkIfBoardRefilled");
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

      setBoardState("checkIfBoardRefilled");
    } else if (boardState === "checkIfBoardRefilled") {
      setTimeout(() => {
        if (poppedMarbles.length > 0) {
          setBoardState("refillHighestEmptyLayer");
          setIsBoardReadyToPop(false);
        } else {
          let isBoardReady =
            findReadyToPopWholeBoard(newBoardComposition).length > 0;
          setIsBoardReadyToPop(isBoardReady);
          if (!isBoardReady) {
            setBoardState("loaded");
          }
        }
      }, 80);
    }
  }, [boardState]);

  // --------------- Functions --------------------------

  function renderBoard() {
    return boardComposition.map((row, rowIdx) => renderRow(row, rowIdx));
  }

  function renderRow(row: IMarble[], rowIdx: number) {
    var firstMarbleRef: HTMLElement | null;
    var secondMarbleRef: HTMLElement | null;
    var firstMarblePos: { X: number; Y: number };
    var dragging = false;
    var distanceDragged = 0;
    var touchStartNeighbors: {
      rowIdx: number;
      colIdx: number;
      position: string;
    }[];

    return (
      <div className="row" key={rowIdx}>
        {row.map((marble: IMarble, colIdx: number) => {
          return (
            <div className="cellBox" key={hashPositionKey(marble)}>
              <Marble
                key={hashPositionKey(marble)}
                hashNumber={hashPositionKey(marble)}
                col={marble.colIdx}
                row={marble.rowIdx}
                color={marble.color}
                onClick={() => {
                  if (movementMode === "click") {
                    handleMarbleClick(marble);
                  }
                }}
                onTouchStart={(e) => {
                  if (movementMode === "drag") {
                    e.preventDefault;
                    if (!dragging) {
                      dragging = true;
                      firstMarbleRef = document.querySelector(
                        `.hash${hashPositionKey(marble)}`
                      );

                      firstMarblePos = {
                        X: e.touches[0].clientX,
                        Y: e.touches[0].clientY,
                      };

                      touchStartNeighbors = getNeighbors(rowIdx, colIdx);
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault;
                  ({ dragging, firstMarbleRef, secondMarbleRef } =
                    handleTouchEnd(
                      firstMarbleRef,
                      secondMarbleRef,
                      dragging,
                      distanceDragged
                    ));
                }}
                onTouchMove={(e) => {
                  e.preventDefault;
                  if (dragging && !!firstMarbleRef) {
                    ({ distanceDragged, secondMarbleRef } = handleDragging(
                      // @ts-ignore
                      e,
                      firstMarbleRef,
                      secondMarbleRef,
                      firstMarblePos,
                      touchStartNeighbors
                    ));
                  }
                }}
                isClicked={marble.isClicked}
                onTouchCancel={(e) => {
                  if (dragging) {
                    ({ dragging, firstMarbleRef, secondMarbleRef } =
                      handleTouchEnd(
                        firstMarbleRef,
                        secondMarbleRef,
                        dragging,
                        distanceDragged
                      ));
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function handleTouchEnd(
    firstMarbleRef: HTMLElement | null,
    secondMarbleRef: HTMLElement | null,
    dragging: boolean,
    distanceDragged: number
  ) {
    if (!gameOn) {
      setGameOn(true);
      // TODO store score in some database
    }
    if (distanceDragged >= MARBLESIZE / 4) {
      dragMarbles(firstMarbleRef, secondMarbleRef);
    }

    resetDraggedMarbles(firstMarbleRef, secondMarbleRef);
    dragging = false;

    return { dragging, firstMarbleRef, secondMarbleRef };
  }

  function handleDragging(
    // @ts-ignore
    e: TouchEvent,
    firstMarbleRef: HTMLElement | null,
    secondMarbleRef: HTMLElement | null,
    firstMarblePos: { X: number; Y: number },
    touchStartNeighbors: {
      rowIdx: number;
      colIdx: number;
      position: string;
    }[]
  ) {
    if (firstMarbleRef) firstMarbleRef.style.zIndex = "2";
    let distanceDragged = 0;
    let horizontal = e.touches[0].clientX - firstMarblePos.X;
    let vertical = e.touches[0].clientY - firstMarblePos.Y;
    const movingHorizontally = Math.abs(horizontal) > Math.abs(vertical);
    const movingVertically = Math.abs(horizontal) < Math.abs(vertical);

    if (movingHorizontally) {
      // @ts-ignore
      [distanceDragged, secondMarbleRef] = visualDragMovement(
        firstMarbleRef,
        secondMarbleRef,
        touchStartNeighbors,
        horizontal,
        "vertical"
      );
    } else if (movingVertically) {
      // @ts-ignore
      [distanceDragged, secondMarbleRef] = visualDragMovement(
        firstMarbleRef,
        secondMarbleRef,
        touchStartNeighbors,
        vertical,
        "horizontal"
      );
    }

    return { distanceDragged, secondMarbleRef };
  }

  function visualDragMovement(
    firstMarbleRef: HTMLElement | null,
    secondMarbleRef: HTMLElement | null,
    touchStartNeighbors: {
      rowIdx: number;
      colIdx: number;
      position: string;
    }[],
    distanceDragged: number,
    blockedAxis: string
  ) {
    let neighborSides =
      blockedAxis === "vertical" ? ["left", "right"] : ["top", "bottom"];

    let neighborSide: string;

    // to make the dragged marble move in one axis only
    resetDragPosition(firstMarbleRef, blockedAxis);
    resetDragPosition(secondMarbleRef);

    if (distanceDragged < 0) {
      neighborSide = neighborSides[0];
    } else {
      neighborSide = neighborSides[1];
    }

    let plusMinusSign = ["left", "top"].includes(neighborSide) ? -1 : 1;

    let neighbor = touchStartNeighbors.filter(
      (neighbor) => neighbor.position === neighborSide
    )[0];

    if (neighbor) {
      secondMarbleRef = document.querySelector(
        `.hash${hashPositionKey(
          boardComposition[neighbor.rowIdx][neighbor.colIdx]
        )}`
      );

      if (firstMarbleRef && secondMarbleRef) {
        const outOfBounds = MARBLESIZE - Math.abs(distanceDragged) <= 0;
        let move = outOfBounds ? plusMinusSign * MARBLESIZE : distanceDragged;
        //@ts-ignore
        firstMarbleRef.style[neighborSides[0]] = `${move}px`;
        //@ts-ignore
        secondMarbleRef.style[neighborSides[0]] = `${-move}px`;
      }
    }

    return [Math.abs(distanceDragged), secondMarbleRef];
  }

  function resetDragPosition(marbleRef: HTMLElement | null, line: string = "") {
    if (!marbleRef) {
      return;
    }
    if (["vertical", ""].includes(line)) {
      marbleRef.style.top = "0px";
    }

    if (["horizontal", ""].includes(line)) {
      marbleRef.style.left = "0px";
    }
  }

  function resetWholeGame() {
    setTimeLeft(timeOfPlay);
    setScore(0);
    resetClickedMarbles();
    setBoardState("unloaded");
    setGameOn(false);
    clearInterval(gameTimer);
  }
  function resetDraggedMarbles(
    firstMarbleRef: HTMLElement | null,
    secondMarbleRef: HTMLElement | null
  ) {
    if (firstMarbleRef && secondMarbleRef) {
      firstMarbleRef.style.zIndex = "0";
      resetDragPosition(firstMarbleRef);
      resetDragPosition(secondMarbleRef);
    }
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
          return acc && !["popped", ""].includes(cur.color);
        }, true)
      );
    }, true);
  }

  function dragMarbles(
    firstMarbleRef: HTMLElement | null,
    secondMarbleRef: HTMLElement | null
  ) {
    let firstMarble = getMarbleFromHash(getHashFromRef(firstMarbleRef));
    let secondMarble = getMarbleFromHash(getHashFromRef(secondMarbleRef));

    setClickedMarbles({
      firstClickedMarble: firstMarble,
      secondClickedMarble: secondMarble,
    });

    setBoardState("switchClickedMarbles");
  }

  function getMarbleFromHash(hashPosition: number | undefined) {
    if (hashPosition !== undefined) {
      let rowIdx = Math.floor(hashPosition / boardSize);
      let colIdx = hashPosition % boardSize;
      return JSON.parse(JSON.stringify(boardComposition[rowIdx][colIdx]));
    }

    return null;
  }

  function getHashFromRef(marbleRef: HTMLElement | null) {
    if (marbleRef) {
      return Number(
        [...marbleRef.classList]
          .filter((className) => className.slice(0, 4) === "hash")
          .map((hash) => hash.slice(4))
      );
    }
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
    if (
      !["loaded", "firstClick", "secondClick", "switchClickedMarbles"].includes(
        boardState
      ) ||
      poppedMarbles.length > 0
    ) {
      return;
    }
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
      neighbors.push({ rowIdx: rowIdx - 1, colIdx: colIdx, position: "top" });
    }
    if (rowIdx + 1 < boardSize) {
      neighbors.push({
        rowIdx: rowIdx + 1,
        colIdx: colIdx,
        position: "bottom",
      });
    }
    if (colIdx - 1 >= 0) {
      neighbors.push({ rowIdx: rowIdx, colIdx: colIdx - 1, position: "left" });
    }
    if (colIdx + 1 < boardSize) {
      neighbors.push({
        rowIdx: rowIdx,
        colIdx: colIdx + 1,
        position: "right",
      });
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
            ? Object.assign(
                {},
                boardComposition[marble.rowIdx - i - 1][marble.colIdx],
                { popped: false }
              )
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
      boardComposition[position.rowIdx][position.colIdx].color = "popped";
    });
    return boardComposition;
  }

  function handleSwitchClick(e: MouseEvent | null) {
    if (e && e.target) {
      //@ts-ignore
      let mode = e.target.checked ? "drag" : "click";
      setMovementMode(mode);
    }
  }

  function saveScore() {
    // TODO
    //
    // var csv = "nickname,score\n";
  }

  return (
    <>
      <InfoBoard
        score={score}
        timeLeft={timeLeft}
        showInfoModal={showInfoModal}
        handleInfoClick={handleInfoClick}
        handleSwitchClick={handleSwitchClick}
        playTime={timeOfPlay}
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
