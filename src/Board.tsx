import { FunctionComponent } from "react";
import Cell from "./Cell";

interface IProps {
  boardSize: number;
}

const Board: FunctionComponent<IProps> = (props) => {
  const { boardSize } = props;

  function renderRow(rowIdx: number) {
    const colIndices = [...Array(boardSize).keys()];
    return (
      <div className="row" key={rowIdx}>
        {colIndices.map((colIdx) => (
          <Cell key={colIdx} col={colIdx} row={rowIdx} />
        ))}
      </div>
    );
  }

  function renderBoard() {
    const rowIndices = [...Array(boardSize).keys()];
    return rowIndices.map((rowIdx) => renderRow(rowIdx));
  }

  return <div className="board">{renderBoard()}</div>;
};

export default Board;
