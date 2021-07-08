import { FunctionComponent, MouseEventHandler, useState } from "react";

interface IProps {
  col: number;
  row: number;
  color: string;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const Cell: FunctionComponent<IProps> = (props) => {
  const { col, row, color } = props;
  let className = "cell marble " + color;

  return <div className={className} onClick={props.onClick}></div>;
};

export default Cell;
