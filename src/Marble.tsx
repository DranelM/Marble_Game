import { FunctionComponent, MouseEventHandler, useState } from "react";

interface IProps {
  col: number;
  row: number;
  color: string;
  onClick: MouseEventHandler<HTMLDivElement>;
  isClicked?: boolean;
  isPopped?: boolean;
}

const Marble: FunctionComponent<IProps> = (props) => {
  const { col, row, color, isClicked, isPopped } = props;
  const clicked = isClicked ? "clicked" : "";
  const popped = isPopped ? "popped" : "";

  let className = `marble ${color} ${clicked} ${popped}`;

  return <div className={className} onClick={props.onClick}></div>;
};

export default Marble;
