import {
  DetailedHTMLProps,
  FunctionComponent,
  MouseEventHandler,
  TouchEventHandler,
  useState,
} from "react";

interface IProps {
  col: number;
  row: number;
  color: string;
  hashNumber: number;
  onClick: MouseEventHandler<HTMLDivElement>;
  onTouchStart: TouchEventHandler;
  onTouchEnd: TouchEventHandler;
  onTouchMove: TouchEventHandler;
  onTouchCancel: TouchEventHandler;
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
      onTouchStart={props.onTouchStart}
      onTouchEnd={props.onTouchEnd}
      onTouchMove={props.onTouchMove}
      onTouchCancel={props.onTouchCancel}
    ></div>
  );
};

export default Marble;
