//#region imports 
import { Circle, Curve, getPropertyMetaOrCreate, Layout, Line, makeScene2D, Ray, Rect, Shape, ShapeProps, Spline, Txt } from "@motion-canvas/2d";
import { all, beginSlide, chain, Color, createEffect, createRef, createSignal, DEG2RAD, delay, linear, loop, makeRef, map, PossibleColor, PossibleVector2, range, Reference, remap, SignalValue, SimpleSignal, spawn, tween, useLogger, usePlayback, useRandom, ValueOf, Vector2, waitFor, waitUntil } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "../components/DataFigure";
import { Graph } from "../components/Graph";
import { plotBlueLine, blueCircle, plotRedLine, redSquare, colors, placeShape, placeSquare } from "../utils/plots";
import { addToSimulation, makeGraph, prepareSimulation } from "./graph";
//#endregion

//let speed: Vector2 = new Vector2(0, 0);

export default makeScene2D(function* (view) {


    const simulationDimension = new Vector2(800, 800);
    const graphDimension = new Vector2(800, 800);
    const simulationDuration = 36;
    const captureInterval = 1;
    const bounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    const yLabel: Txt = <Txt><Txt fill={"#FFDA76"} text={"cos(t)"}></Txt></Txt> as Txt;
    const xLabel: Txt = <Txt><Txt fill={"#B4D6CD"} text={"sin(t)"}></Txt></Txt> as Txt;

    const graph = makeGraph(view, graphDimension, simulationDimension, xLabel, yLabel, bounds);
    const circleRef = makeObjectToSimulate(new Vector2([0, 0]));
    circleRef().opacity(.4);

    // const cosCircRef = makeObjectToSimulate(new Vector2([0, 0]));
     const sinCircRef = makeObjectToSimulate(new Vector2([0, 0]));

    const simulationRef = prepareSimulation(view, simulationDimension, );

    const dataSignal = addToSimulation(simulationRef, circleRef, graph, (pos: Vector2) => <Rect></Rect> as Rect);
    const dataSinSignal = addToSimulation(simulationRef, circleRef, graph, (pos: Vector2) => <Rect radius={20} width={10} height={10} fill={"#B4D6CD"} opacity={.5} position={pos}></Rect> as Shape, true);
    const dataCosSignal = addToSimulation(simulationRef, circleRef, graph, (pos: Vector2) => <Rect radius={20} width={10} height={10} fill={"#FFDA76"} opacity={.5} position={pos}></Rect> as Rect);

    for(let i = 0; i < simulationDuration / captureInterval; i++) {
        yield simulate(
            dataSignal,
            simulationDimension,
            bounds,
            captureInterval,
            captureInterval,
            circleRef,
            moveCircle,
            getPosition
        );

        yield simulate(
            dataSinSignal,
            simulationDimension,
            bounds,
            captureInterval,
            captureInterval,
            circleRef,
            () => { },
            (simObj: Reference<Shape>, bounds: ValueBounds): Vector2 => {
                const time = usePlayback().time;
                const mappedTime = remap(0, 40, -1, 1, time);
                const mappedX = remap(-400, 400, -1, 1, simObj().position().x);
                
                return new Vector2([mappedTime, mappedX]);
            }
        );

        yield* simulate(
            dataCosSignal,
            simulationDimension,
            bounds,
            captureInterval,
            captureInterval,
            circleRef,
            () => { },
            (simObj: Reference<Shape>, bounds: ValueBounds): Vector2 => {
                const time = usePlayback().time;
                const mappedTime = remap(0, 40, -1, 1, time);
                const mappedY = remap(400, -400, -1, 1, simObj().position().y)
                
                return new Vector2([mappedTime, mappedY]);
            }
        );
    }
    yield* beginSlide("end");
})

function makeObjectToSimulate(startingPos: Vector2) {
    const circleRef = createRef<Circle>();

    <Circle ref={circleRef} position={startingPos} size={80} fill={colors.red}></Circle>;
    return circleRef;
}

function accelerate(deltaTime: number, time: number, simObj?: Reference<Shape>) {

}

function randomWalk(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const rand = useRandom();
    const dir = new Vector2(rand.nextFloat(-1, 1), rand.nextFloat(-1, 1)).normalized;
    const speed = new Vector2([15, 15]);

    const offset = dir.mul(speed);

    simObj().position.add(offset);
}

function moveBackAndForth(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const speed = 1.5;
    const angle = remap(0, 6, 0, 360, (time * speed) % 6) * DEG2RAD;
    const newPos = new Vector2([Math.sin(angle), Math.cos(angle)]).normalized.mul([200, 200]);
    const newSize = map(5, 10, Math.abs(Math.sin(angle * 3)) * 10);
    simObj().position(newPos).size(newSize);
}

function moveCircleQustionMark(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const speed = 1;
    const deg = remap(0, 6, 0, 360, (time * speed) % 6);

    const primary = new Vector2([Math.sin(deg * DEG2RAD), Math.cos(deg * DEG2RAD)]).mul([200, 200]);
    const secondary = new Vector2([Math.cos(deg * 10 * DEG2RAD), Math.sin(deg * 10 * DEG2RAD)]).mul([50, 50])

    const newPos = primary.add(secondary);
    simObj().position(newPos);
}

function moveCircle(deltaTime: number, timeSinceCapture: number, simObj?: Reference<Shape>) {
    const time = usePlayback().time;
    const speed = 10;
    const deg = (time * speed) % 360;
    const newPos = new Vector2([Math.sin(deg * DEG2RAD), Math.cos(deg * DEG2RAD)]).mul([-300, -300]);
    simObj().position(newPos);
}


function moveStraight(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const speed = new Vector2(10, 10);
    const offset = (speed.mul(deltaTime));

    const correctedOffset = offset.mul([1, -1]);
    simObj().position.add(correctedOffset);
}

function getPosition(simObj: Reference<Shape>, bounds: ValueBounds) {
    const position = simObj().position();
    const mirroredPosition = position.mul([1, -1]);
    const origin = new Vector2(bounds.maxX, bounds.maxY).mul([.5, .5]);
    const translatedPosition = mirroredPosition.add([0, 0]);
    return translatedPosition;
}

function* simulate(
    dataSignal: SimpleSignal<any>,
    sd: number | Vector2,
    bounds: ValueBounds,
    captureInterval: number,
    duration: number,
    simObj: Reference<Shape>,
    updateSimulation: (deltaTime?: number, time?: number, simObj?: Reference<Shape>) => void,
    getValue: (simObj: Reference<Shape>, bounds: ValueBounds) => Vector2
) {
    let timeSinceCapture = Number.MAX_VALUE;
    bounds = bounds ?? { minX: 0, maxX: new Vector2(sd).x, minY: 0, maxY: new Vector2(sd).y };

    // Funcție care se va apela în fiecare cadru al animației timp de @duration
    yield* tween(duration, (value, time) => {
        const deltaTime = usePlayback().deltaTime;

        updateSimulation(deltaTime, time, simObj);
        if ((timeSinceCapture - captureInterval) >= Number.EPSILON) {
            timeSinceCapture = 0;
            const newGraphValue = getValue(simObj, bounds);

            updateGraph(sd, bounds, newGraphValue, dataSignal);
        } else {
            timeSinceCapture += deltaTime;
        }
    });
}

function updateGraph(sd: number | Vector2, bounds: ValueBounds, newPosition: Vector2, dataSignal: SimpleSignal<any>) {
    dataSignal(dataSignal().concat(newPosition));
}

function fancyPlace(pos: Vector2) {
    const rgb = `rgb(${remap(-400, 500, 0, 255, pos.x).toFixed(0)}, 0, ${remap(-400, 500, 0, 255, pos.y).toFixed(0)})`;
    const color = new Color(rgb);
    return placeShape({ size: 20, fill: color }, Circle);
}