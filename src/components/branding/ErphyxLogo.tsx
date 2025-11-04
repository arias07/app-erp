import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ErphyxLogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const ErphyxLogo: React.FC<ErphyxLogoProps> = ({
  width = 120,
  height = 120,
  style
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 267.74 267.74"
      style={style}
    >
      <Rect
        x="1.5"
        y="1.5"
        width="264.74"
        height="264.74"
        rx="42.86"
        fill="none"
        stroke="#a3c400"
        strokeMiterlimit="10"
        strokeWidth="3"
      />
      <Path
        d="m162.24,75.64l-74.25,58.23,74.25,58.23"
        fill="none"
        stroke="#a3c400"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="18"
      />
    </Svg>
  );
};
