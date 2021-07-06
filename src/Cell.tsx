import { FunctionComponent } from "react";

interface IProps {
  col: number;
  row: number;
}

const Cell: FunctionComponent<IProps> = (props) => {
  const { col, row } = props;

  return (
    <div className="cell">
      ({col} , {row})
    </div>
  );
};

export default Cell;
