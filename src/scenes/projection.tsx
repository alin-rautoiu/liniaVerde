import { Circle, Curve, Line, makeScene2D, Ray, Rect, Shape, ShapeProps, Spline } from "@motion-canvas/2d";
import { all, Color, createRef, createRefArray, createSignal, map, PossibleColor, PossibleVector2, SignalValue, tween, unwrap, useRandom, Vector2, waitFor } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "../components/DataFigure";
import { Graph } from "../components/Graph";
import { plotBlueLine, blueCircle, plotRedLine, redSquare, plotLine, placeShape, colors } from "../utils/plots";
import projectionData from '../data/emmision_projection.json'

export default makeScene2D(function* (view) {

    var graph = createRef<Graph>();
    var random = useRandom();
    var boundsSignal = createSignal<ValueBounds>({ minX: 1990.0, maxX: 2020.0, minY: 0.0, maxY: 17129600000.0 });

    view.add(
        <Graph yTickGenerator={(val) => (val / 10000000).toFixed(2) + "t"} yLabel={"tone CO2"} ticks bounds={() => boundsSignal()} ref={graph} graphSize={[1700, 900]}></Graph>);

    const greenHouse = createSignal(projectionData.map(d => [d.Year, d["Greenhouse gas emissions from electricity and heat"]]));
    const industry = createSignal(projectionData.map(d => [d.Year, d["Greenhouse gas emissions from industry"] + random.nextFloat(5000000, 200000000)]));
    const transport = createSignal(projectionData.map(d => [d.Year, d["Greenhouse gas emissions from transport"] + random.nextFloat(5000000, 200000000)]));
    const agriculture = createSignal(projectionData.map(d => [d.Year, d["Greenhouse gas emissions from agriculture"] + random.nextFloat(5000000, 200000000)]));
    const construction = createSignal(projectionData.map(d => [d.Year, d["Greenhouse gas emissions from manufacturing and construction"] + random.nextFloat(5000000, 200000000)]));

    const sources = [greenHouse, industry, transport, agriculture, construction];
    const dataRefs = createRefArray<DataFigure>();
    sources.map((s, idx) => {
        const newColor = () => Color.lerp(new Color(colors.lineGreen), new Color(colors.blue), idx / sources.length);
        const figureSize = 10;
        return graph().container.add(
        <DataFigure 
            ref={dataRefs}
            plotGenerator={() => plotLine({smoothness: .3, lineWidth: 4, stroke: newColor})}
            place={() => placeShape({width: figureSize, height: figureSize, fill: newColor, radius: 3}, Rect)}
            tweenShape={(figure: Shape) => figure.size([figureSize, figureSize], .3)}
            data={[]}></DataFigure>)
        })

    for(let i = 0; i < 30 ; i++) {
        sources.map((s, idx) => dataRefs[idx].data(s().slice(0, i)));
        yield* waitFor(.3); 
    }

    
    for(let i = 29; i < greenHouse().length - 1; i++) {
        sources.map((s, idx) => dataRefs[idx].data(s().slice(0, i)));
        
        yield* boundsSignal( {
            minX: boundsSignal().minX + 1,
            maxX: boundsSignal().maxX + 1,
            minY: boundsSignal().minY,
            maxY: boundsSignal().maxY
        }, .3);
        
    }

    yield* waitFor(2);

})