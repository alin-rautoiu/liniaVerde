//#region imports 
import { Circle, Curve, getPropertyMetaOrCreate, Line, makeScene2D, Ray, Rect, Shape, ShapeProps, Spline, Txt } from "@motion-canvas/2d";
import { all, beginSlide, chain, Color, createEffect, createRef, createSignal, DEG2RAD, delay, linear, loop, makeRef, map, PossibleColor, PossibleVector2, Reference, remap, SignalValue, SimpleSignal, tween, useLogger, usePlayback, useRandom, ValueOf, Vector2, waitFor, waitUntil } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "../components/DataFigure";
import { Graph } from "../components/Graph";
import { plotBlueLine, blueCircle, plotRedLine, redSquare, colors, placeShape, placeSquare } from "../utils/plots";
//#endregion

//let speed: Vector2 = new Vector2(0, 0);

export default makeScene2D(function* (view) {


    const simulationDimension = new Vector2(800, 800);
    const graphDimension = new Vector2(800, 800);
    const simulationDuration = 40;
    const captureInterval = .5;
    const bounds = { minX: 0, maxX: simulationDuration, minY: -400, maxY: 400 };
    const graph = makeGraph(view, graphDimension, simulationDimension, "t", "v", bounds);
    const circleRef = makeObjectToSimulate(new Vector2([0, 0]));
    
    const simulationRef = prepareSimulation(view, simulationDimension);
    const dataSignal = addToSimulation(simulationRef, circleRef, graph);
    


    let speed: Vector2 = new Vector2(0, 0);
    let bounce = new Vector2(1, 1);
    const logger = useLogger();
    const moveAcc = (deltaTime: number, time: number, simObj?: Reference<Shape>) => {
        const acc = 1;
        bounce.x = Math.abs(simObj().position().x) > 400 ? bounce.x * -1 : bounce.x;
        bounce.y = Math.abs(simObj().position().y) > 400 ? bounce.y * -1 : bounce.y; 

        speed = speed.add(new Vector2(acc, acc)).mul([bounce.x, bounce.y]);

        const offset = (speed.mul(deltaTime));

        const correctedOffset = offset.mul([.1, -1]);
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

    yield* beginSlide("end");
})

export function makeObjectToSimulate(startingPos: Vector2) {
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
    const speed = 1;
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

function moveCircle(deltaTime: number, time: number, simObj?: Reference<Shape>) {
    const speed = 10;
    const deg = remap(0, 6, 0, 360, (time * speed) % 6);
    const newPos = new Vector2([time * speed, Math.sin(deg * DEG2RAD)]).mul([50, 10]);
    simObj().position(newPos);
}


export function makeGraph(view: any, gd: number | Vector2, sd: number | Vector2,
    xLabel: Txt | string = "x",
    yLabel: Txt | string = "y",
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

export function prepareSimulation(view: any,
    sd: number | Vector2
) : Reference<Rect> {

    const simulationRef = createRef<Rect>();
    view.add(
    <Rect ref={simulationRef} clip position={[1920 / 4, 0]} size={sd} stroke={"white"} lineWidth={1}>
    </Rect>);

    return simulationRef;
}

export function addToSimulation(
    simulation: Reference<Shape>,
    simulatedObject: Reference<Shape>,
    graph: Reference<Graph>,
    place: (pos: Vector2) => Shape = () => blueCircle(),
    overlay?: boolean
) {
    const capturedPositions: Vector2[] = [];

    const dataSignal = createSignal<SignalValue<PossibleVector2>[]>(() => capturedPositions);

    const dfRef = createRef<DataFigure>();

    simulation().add(simulatedObject())
    if (overlay) {
        simulation().add(<>
        <Ray lineWidth={1} stroke={"B4D6CD"} from={() => simulatedObject().position()} to={() => [simulatedObject().position().x, 400]}></Ray>
        <Ray lineWidth={1} stroke={"FFDA76"} from={() => [simulatedObject().position().x, simulatedObject().position().y]} to={() => [-400, simulatedObject().position().y]}></Ray>
        </>)
    }

    graph().container.add(<DataFigure
        ref={dfRef}
        place={place}
        //plotGenerator={plotBlueLine}
        data={() => dataSignal()}></DataFigure>);
    return dataSignal;
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

export function* simulate(
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