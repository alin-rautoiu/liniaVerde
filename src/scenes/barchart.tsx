//#region imports 
import { Circle, Curve, getPropertyMetaOrCreate, Line, makeScene2D, Ray, Rect, Shape, ShapeProps, Spline } from "@motion-canvas/2d";
import { all, chain, Color, createEffect, createRef, createSignal, DEG2RAD, delay, linear, loop, makeRef, map, PossibleColor, PossibleVector2, Reference, remap, SignalValue, SimpleSignal, tween, useLogger, usePlayback, useRandom, Vector2, waitFor, waitUntil } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "../components/DataFigure";
import { Graph } from "../components/Graph";
import { plotBlueLine, blueCircle, plotRedLine, redSquare, colors, placeShape, placeSquare } from "../utils/plots";
import { addToSimulation, makeGraph, makeObjectToSimulate, prepareSimulation, simulate } from "./graph";
//#endregion

export default makeScene2D(function* (view) {

    
    const simulationDimension = new Vector2(800, 800);
    const graphDimension = new Vector2(800, 800);
    const simulationDuration = 40;
    const captureInterval = 1;
    const bounds = { minX: 0, maxX: simulationDuration, minY: 0, maxY: 566};
    const graph = makeGraph(view, graphDimension, simulationDimension, "t", "v", bounds);
    const circleRef = makeObjectToSimulate(new Vector2([0, 0]));
    
    const simulationRef = prepareSimulation(view, simulationDimension);
    const logger = useLogger();
    let bounce: Vector2 = new Vector2([1, 1]);
    let speed: Vector2 = new Vector2([-100, 0]);
    const placeBarchart = (value: Vector2) : Shape => {
        logger.debug(value.y.toString());
        return <Rect offset={[0, -1]} height={bounds.maxY - value.y} width={10} fill={Color.lerp(new Color("4F1787"), new Color("EB3678"), (value.y) / 400)}></Rect> as Rect;
    }
    const dataSignal = addToSimulation(simulationRef, circleRef, graph, placeBarchart)

    const moveAcc = (deltaTime: number, time: number, simObj?: Reference<Shape>) => {
        const acc = new Vector2(-1, .1);
        if (Math.abs(simObj().position().x) > 400) {
            logger.debug("BOUNCE");
            bounce.x = bounce.x * -1;
        }

        if (Math.abs(simObj().position().y) > 400) {
            logger.debug("BOUNCE");
            bounce.y = bounce.y * -1; 
        }

        speed = speed.add(acc).mul([bounce.x, bounce.y]);

        const offset = (speed.mul(deltaTime));

        const correctedOffset = offset.mul([-1, 1]);
        simObj().position.add(correctedOffset);
    };

    const getSpeed = (simObj: Reference<Shape>, bounds: ValueBounds) => {
        const time = usePlayback().time;
        return new Vector2(time, speed.magnitude);

    };

    yield* simulate(
        dataSignal,
        simulationDimension,
        bounds,
        captureInterval,
        simulationDuration,
        circleRef,
        moveAcc,
        getSpeed
    );
})
