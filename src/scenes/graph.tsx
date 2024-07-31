//#region imports 
import { Circle, Curve, getPropertyMetaOrCreate, Line, makeScene2D, Ray, Rect, Shape, ShapeProps, Spline } from "@motion-canvas/2d";
import { Color, createEffect, createRef, createSignal, DEG2RAD, linear, loop, makeRef, map, PossibleColor, PossibleVector2, Reference, remap, SignalValue, SimpleSignal, tween, usePlayback, useRandom, Vector2, waitFor, waitUntil } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "../components/DataFigure";
import { Graph } from "../components/Graph";
import { plotBlueLine, blueCircle, plotRedLine, redSquare, colors, placeShape, placeSquare } from "../utils/plots";
//#endregion

export default makeScene2D(function* (view) {

    const graphDimension = new Vector2(800, 800);
    const simulationDimension = new Vector2(800, 800);
    const simulationDuration = 16;
    const bounds = { minX: 0, maxX: simulationDimension.x, minY: 0, maxY: simulationDimension.y };

    const graph = makeGraph(view, graphDimension, simulationDimension, "x", "y", bounds);

    const circleRef = makeObjectToSimulate(new Vector2([-simulationDimension.x / 2, 0]));
    const dataSignal = prepareSimulation(view, simulationDimension, graph, circleRef);
    const captureInterval = .5;

    yield* simulate(
        dataSignal,
        simulationDimension,
        bounds,
        captureInterval,
        simulationDuration,
        circleRef,
        moveStraight,
        getPosition
    );
})

function makeObjectToSimulate(startingPos: Vector2) {
    const circleRef = createRef<Circle>();

    <Circle ref={circleRef} position={startingPos} size={80} fill={colors.red}></Circle>;
    return circleRef;
}

function makeGraph(view: any, gd: number | Vector2, sd: number | Vector2,
    xLabel: string = "x",
    yLabel: string = "y",
    bounds: ValueBounds = { minX: 0, maxX: new Vector2(sd).x, minY: 0, maxY: new Vector2(sd).y }): Reference<Graph> {
    var graph = createRef<Graph>();

    view.add(<Graph ticks
        ref={graph}
        yLabel={yLabel}
        xLabel={xLabel}
        position={[-1920 / 4, 0]}
        bounds={bounds}
        graphSize={gd}></Graph>);

    return graph;
}

function prepareSimulation(view: any,
    sd: number | Vector2,
    graph: Reference<Graph>,
    simulatedObject: Reference<Shape>,
    place: (pos: Vector2) => Shape = () => blueCircle()
) {
    const capturedPositions: Vector2[] = [];

    const dataSignal = createSignal<SignalValue<PossibleVector2>[]>(() => capturedPositions);

    const dfRef = createRef<DataFigure>();

    view.add(<Rect clip position={[1920 / 4, 0]} size={sd} stroke={"white"} lineWidth={1}>
        {simulatedObject()}
    </Rect>);

    graph().container.add(<DataFigure
        ref={dfRef}
        place={place}
        data={() => dataSignal()}></DataFigure>);
    return dataSignal;
}

function moveStraight(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const offset = (new Vector2(50, 10)).mul(deltaTime);
    const correctedOffset = offset.mul([1, -1]);
    simObj().position.add(correctedOffset);
}

function getPosition(simObj: Reference<Shape>, bounds: ValueBounds) {
    const position = simObj().position();
    const mirroredPosition = position.mul([1, -1]);
    const origin = new Vector2(bounds.maxX, bounds.maxY).mul([.5, .5]);
    const translatedPosition = mirroredPosition.add(origin);
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