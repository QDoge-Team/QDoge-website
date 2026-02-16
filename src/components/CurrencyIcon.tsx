import React from "react";
import { QubSvg } from "./svgs";

type CurrencyIconProps = {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
};

const CurrencyIcon = (props: CurrencyIconProps) => {
  const { src, alt, className, style, width, height } = props;

  if (typeof src === "string") {
    return (
      <img
        src={src}
        alt={alt ?? "currency"}
        className={className}
        style={style}
        width={width}
        height={height}
      />
    );
  }

  return (
    <QubSvg
      className={className}
      style={style}
      width={width}
      height={height}
    />
  );
};

export default CurrencyIcon;