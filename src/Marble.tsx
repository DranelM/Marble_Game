import { FunctionComponent, MouseEventHandler, useState } from "react";

interface IProps {
  col: number;
  row: number;
  color: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  isClicked?: boolean;
}

const Marble: FunctionComponent<IProps> = (props) => {
  const { col, row, color, isClicked } = props;
  const clicked = isClicked ? "clicked" : "";

  let className = `marble ${color} ${clicked}`;

  return <div className={className} onClick={props.onClick}></div>;
};

export default Marble;
