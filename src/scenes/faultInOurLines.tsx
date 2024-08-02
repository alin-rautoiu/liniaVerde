import { Circle, makeScene2D, Shape } from "@motion-canvas/2d";
import { Graph } from "../components/Graph";
import { beginSlide, chain, createRef, createSignal, DEG2RAD, PossibleVector2, range, SignalValue, SimpleSignal, Vector2, waitFor, waitTransition } from "@motion-canvas/core";
import { DataFigure } from "../components/DataFigure";
import { blueCircle, colors, plotBlueLine, plotLine } from "../utils/plots";

export default makeScene2D(function* (view) {

    const data = createSignal<SignalValue<PossibleVector2[]>>(range(60).map(i => new Vector2([Math.sin(i * 6 * DEG2RAD) * 200, Math.cos(i * 6 * DEG2RAD) * 200])));
    const graph = createRef<Graph>();

    const lineWidth = createSignal<number>(1);
    const end = createSignal<number>(0);
    const smoothness = createSignal<number>(.55);

    const df = createRef<DataFigure>();
    view.add(<Graph ref={graph} ticks bounds={{minX: -400, maxX: 400, minY: -400, maxY: 400}} graphSize={[800, 800]}>
    </Graph>)

        graph().container.add(<DataFigure ref={df} plotGenerator={() => plotLine({end: () => end(), closed: true, lineWidth: () => lineWidth(), stroke: colors.blue, smoothness: () => smoothness()})} data={() => data()} place={blueCircle}></DataFigure>);

    yield* beginSlide("line");
    
    yield* beginSlide("no-line");
    const twoThirds = df().childrenAs<Shape>().filter((x, idx) => idx % 3 != 0);
    yield* chain(...twoThirds.map(c => c.size(0, .05)));
    
    yield* beginSlide("putline");
    yield* end(1, 1);

    yield* beginSlide("four")
    const allButFour = df().childrenAs<Circle>().filter((x, idx) => x instanceof Circle &&  idx % 15 != 0);
    const four = df().childrenAs<Circle>().filter((x, idx) => x instanceof Circle && (idx - 2) % 15 == 0);
    console.log(four);
    yield* chain(...allButFour.map(c => c.size(0, .05)));

    yield* beginSlide("fourStraight");
    yield data(four.map(c => c.position()));
    yield* smoothness(0, 1);
    yield* beginSlide("end");



})