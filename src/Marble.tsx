import {
  DetailedHTMLProps,
  FunctionComponent,
  MouseEventHandler,
  useState,
} from "react";

interface IProps {
  col: number;
  row: number;
  color: string;
  hashNumber: number;
  onClick: MouseEventHandler<HTMLDivElement>;
  onMouseDown: MouseEventHandler;
  onMouseUp: MouseEventHandler;
  onMouseMove: MouseEventHandler;
  onMouseOut: MouseEventHandler;
  isClicked?: boolean;
}

const Marble: FunctionComponent<IProps> = (props) => {
  const { hashNumber, color, isClicked } = props;
  const clicked = isClicked ? "clicked" : "";

  let className = `marble ${color} ${clicked} hash${hashNumber}`;

  return (
    <div
      className={className}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseMove={props.onMouseMove}
      onMouseOut={props.onMouseOut}
    ></div>
  );
};

export default Marble;
