import { Circle, Rect, Shape, ShapeProps, Spline, SplineProps } from "@motion-canvas/2d";
import { createRef, PossibleColor } from "@motion-canvas/core";

const red: PossibleColor = "#d64747"
const blue: PossibleColor = "#2571ff"
const backgroundBlue: PossibleColor = "#04325c"
const lineGreen: PossibleColor = "#00db5a"

export const colors = {red, blue, backgroundBlue, lineGreen}

export function redSquare() {
    return placeSquare(10, 10, red);
}

export function blueCircle() {
    return placeShape({width: 20, height: 20, fill: blue}, Circle);
}

export function placeSquare(height?: number, width?: number, fill?: PossibleColor, stroke?: PossibleColor) {
    return placeShape({width: width, height: height, fill: fill, stroke: stroke}, Rect);
}

export function placeShape<T extends Shape, P extends ShapeProps>(props: P, t: new(...args: any[]) => T) : T {
    return new t({...props});
}

export function plotRedLine() : Spline {
    return <Spline points={() => []} closed={false} stroke={red} lineWidth={2} smoothness={0}></Spline> as Spline;
}

export function plotBlueLine() : Spline { 
    return <Spline points={() => []} closed={false} stroke={blue} lineWidth={2} smoothness={0}></Spline> as Spline;
}

export function plotLine(props: SplineProps) {
    return <Spline points={() => []} closed={false} stroke={props?.stroke ?? lineGreen} lineWidth={props?.lineWidth ?? 2} smoothness={props?.smoothness ?? 0}></Spline> as Spline
}