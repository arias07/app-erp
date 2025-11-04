import React from 'react';
import Svg, { Path, Rect, Text as SvgText, TSpan } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ErphyxBrandProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const ErphyxBrand: React.FC<ErphyxBrandProps> = ({
  width = 320,
  height = 120,
  style
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 802.12 267.74"
      style={style}
    >
      {/* Logo Icon */}
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

      {/* ERPHYX Text */}
      <SvgText
        transform="translate(302.71 176.77)"
        fill="#1e3b33"
        fontFamily="Satoshi-Black, Satoshi"
        fontSize="119.7"
        fontWeight="900"
      >
        <TSpan x="0" y="0">ERPHYX</TSpan>
      </SvgText>

      {/* GO Text */}
      <SvgText
        transform="translate(668.25 218.49)"
        fill="#a3c400"
        fontFamily="Satoshi-Bold, Satoshi"
        fontSize="66.89"
        fontWeight="700"
      >
        <TSpan x="0" y="0">GO</TSpan>
      </SvgText>
    </Svg>
  );
};
