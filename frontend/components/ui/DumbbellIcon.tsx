import React from "react";
import Svg, { Line, Rect } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
  /** Plein (onglet sélectionné) ou vide, contour seul. */
  filled?: boolean;
};

const PLATES = [
  { x: 1.75, y: 7.25, w: 3, h: 9.5 },
  { x: 5.25, y: 4.75, w: 3.5, h: 14.5 },
  { x: 15.25, y: 4.75, w: 3.5, h: 14.5 },
  { x: 19.25, y: 7.25, w: 3, h: 9.5 },
];

/** Haltère : l'`barbell-outline` d'Ionicons reste visuellement plein, d'où ce tracé vraiment vide. */
export default function DumbbellIcon({ size = 24, color, filled = false }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {PLATES.map((plate, i) => (
        <Rect
          key={i}
          x={plate.x}
          y={plate.y}
          width={plate.w}
          height={plate.h}
          rx={1.4}
          fill={filled ? color : "none"}
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
      <Line x1={8.75} y1={12} x2={15.25} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
