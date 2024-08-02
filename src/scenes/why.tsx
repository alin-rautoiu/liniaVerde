//#region imports
import { Layout, makeScene2D, Ray, Rect, Shape, Txt } from "@motion-canvas/2d";
import { all, beginSlide, chain, createRef, createSignal, makeRef, makeRefs, map, PossibleVector2, SignalValue, spawn, tween, useRandom, Vector2, waitFor } from "@motion-canvas/core";
import { Graph } from "../components/Graph";
import { DataFigure } from "../components/DataFigure";
import { blueCircle } from "../utils/plots";
//#endregion

///Mai mult exemplu de așa nu

export default makeScene2D(function* (view) {
    const creditRef = createRef<Txt>();
    view.add(<Txt textWrap ref={createRef} position={[800, 500]} fill={"white"} width={300} fontSize={14} wrap={"wrap"}>După F. J. Anscombe, "Graphs in Statistical Analysis", <Txt fontStyle={"italic"}>American Statistician (Feb. 1973)</Txt> via Edward R. Tufte, <Txt fontStyle={"italic"}>The Visual Display of Quantitive Information"</Txt></Txt>)

    const setI   = [[10.0, 8.04], [8.0, 6.95], [13.0, 7.58],  [9.0, 8.81], [11.0, 8.33], [14.0, 9.96], [6.0, 7.24], [4.0, 4.26], [12.0, 10.84], [7.0, 4.82], [5.0, 5.68]];
    const setII  = [[10.0, 9.14], [8.0, 8.14], [13.0, 8.74],  [9.0, 8.77], [11.0, 9.26], [14.0, 8.10], [6.0, 6.13], [4.0, 3.10], [12.0, 9.13],  [7.0, 7.26], [5.0, 4.74]];
    const setIII = [[10.0, 7.46], [8.0, 6.77], [13.0, 12.74], [9.0, 7.11], [11.0, 7.81], [14.0, 8.84], [6.0, 6.08], [4.0, 5.39], [12.0, 8.15], [7.0, 6.42], [5.0, 5.73]];
    const setIV  = [[8.00, 6.58], [8.00, 5.76], [8.0, 7.74],  [8.0, 8.84], [8.0 , 8.47], [8.0, 7.04], [8.0, 5.25], [19.0, 12.5], [8.0, 5.56], [8.0, 5.73], [8.0, 6.89]];
    const textRefs: Txt[] = [];
    const positions: PossibleVector2[] = [[-600, -300], [600, -300], [-600, 200], [600, 200]];

    const sets = [setI, setII, setIII, setIV];
    const setRefs: Layout[] = [];
    console.log(sets);
    let i = 0;
    view.add(<>
        {...sets.map((set, idx) => {
            return <Layout ref={makeRef(setRefs, idx)} opacity={() => 0} layout direction={"column"} width={200} position={() => positions[idx]}>
                {/* //horrible lazy hack */}
                <Txt alignSelf={"center"} text={() => idx == 0 ? "I" : idx == 1 ? "II" : idx == 2 ? "III" : idx == 3 ? "IV" : ""} fill={"white"} fontSize={30}></Txt>
                <Layout layout direction={"row"} justifyContent={"space-around"}>
                    <Txt fill={"white"} fontSize={30}>X</Txt>
                    <Txt fill={"white"} fontSize={30}>Y</Txt>
                </Layout>
                <Rect marginBottom={8} width={"100%"} height={2} fill={"white"}></Rect>

                {
                    ...set.map((v, id) => {
                        return <Layout layout direction={"row"} justifyContent={"space-around"}>
                            <Txt ref={makeRef(textRefs, i++)} fill={"white"} fontSize={() => 0} text={v[0].toFixed(1)}></Txt>
                            <Txt ref={makeRef(textRefs, i++)} fill={"white"} fontSize={() => 0} text={v[1].toFixed(1)}></Txt>
                        </Layout>
                    })
                }
            </Layout>
        })}
    </>
    )
    yield* chain(...setRefs.map(s => s.opacity(1, .2)));
    yield* chain(...textRefs.map(c => c.fontSize(20, .02)));

    yield* beginSlide("0.1")
    const legend = createRef<Layout>();
    view.add(
    <Layout clip ref={legend} direction={"column"} alignItems={"center"} layout>
        <Txt opacity={0} fontSize={30} fill={"white"} ref={(node) => spawn(node.opacity(1, .5))}>N = 11</Txt>
        <Txt opacity={0} fontSize={30} fill={"white"} ref={(node) => spawn(node.opacity(0, .5).to(1, .5))}>mediana valorilor de pe X: 9,0</Txt>
        <Txt opacity={0} fontSize={30} fill={"white"} ref={(node) => spawn(node.opacity(0, 1).to(1, .5))}>mediana valorilor de pe Y: 7,5</Txt>
        <Txt opacity={0} fontSize={30} fill={"white"} ref={(node) => spawn(node.opacity(0, 1.5).to(1, .5))}>regresie: y = 3 + 0,5x</Txt>
        <Txt opacity={0} fontSize={30} fill={"white"} ref={(node) => spawn(node.opacity(0, 2).to(1, .5))}>coeficient de corelație: 0,82</Txt>



    </Layout>)

    yield* waitFor(2.5);

    yield* beginSlide("1");
    const graphRefI = createRef<Graph>();
    view.add(<Graph opacity={0} ref={graphRefI} bounds={{ minX: 0, maxX: 20, minY: 0, maxY: 15 }} graphSize={[600, 400]} position={positions[0]}>
    </Graph>);
    yield* all(
        legend().size(0, .5),
        legend().opacity(0, .5),
        setRefs[0].x(-150, .5),
        setRefs[1].x(150, .5),
        setRefs[2].x(-150, .5),
        setRefs[3].x(150, .5),
        graphRefI().opacity(1, .5)
    )

    const signalI = createSignal<SignalValue<PossibleVector2>[]>([]);
    const dfI = createRef<DataFigure>();
    graphRefI().container.add(<DataFigure ref={dfI} data={signalI} place={blueCircle} tweenShape={(shape) => shape.size([20, 20], .2)}></DataFigure>)
    yield* tween(2.5, (value, time) => {
        const idx: number = Math.ceil(map(0, setI.length, value));
        signalI(setI.slice(0, idx));
        const children = dfI().children();
        const circ = children[idx - 1];
        if (!circ) return;
        console.log(circ.absolutePosition());
        spawn(textRefs[2 * idx - 2].opacity(0, .1));
        spawn(textRefs[2 * idx - 1].opacity(0, .1));
        spawn(textRefs[2 * idx - 2].margin([0, 100, 0, -100], .1));
        spawn(textRefs[2 * idx - 1].margin([0, 100, 0, -100], .1));

    });
    yield* waitFor(.5);
    yield* beginSlide("2");

    const graphRefII = createRef<Graph>();
    view.add(<Graph opacity={0} ref={graphRefII} bounds={{ minX: 0, maxX: 20, minY: 0, maxY: 15 }} graphSize={[600, 400]} position={positions[1]}>
    </Graph>);
    yield* graphRefII().opacity(1, .5);
    const signalII = createSignal<SignalValue<PossibleVector2>[]>([]);
    const dfII = createRef<DataFigure>();
    graphRefII().container.add(<DataFigure ref={dfII} data={signalII} place={blueCircle} tweenShape={(shape) => shape.size([20, 20], .2)}></DataFigure>)
    yield* tween(2.5, (value, time) => {
        const idx: number = Math.ceil(map(0, setII.length, value));
        signalII(setII.slice(0, idx));
        const children = dfII().children();
        const circ = children[idx - 1];
        if (!circ) return;
        console.log(circ.absolutePosition());
        spawn(textRefs[2 * (idx + 11) - 2].opacity(0, .1));
        spawn(textRefs[2 * (idx + 11) - 1].opacity(0, .1));
        spawn(textRefs[2 * (idx + 11) - 2].margin([0, -100, 0, 100], .1));
        spawn(textRefs[2 * (idx + 11) - 1].margin([0, -100, 0, 100], .1));

    });
    yield* waitFor(.5);
    yield* beginSlide("3");

    const graphRefIII = createRef<Graph>();
    view.add(<Graph opacity={0} ref={graphRefIII} bounds={{ minX: 0, maxX: 20, minY: 0, maxY: 15 }} graphSize={[600, 400]} position={positions[2]}>
    </Graph>);
    yield* graphRefIII().opacity(1, .5);
    const signalIII = createSignal<SignalValue<PossibleVector2>[]>([]);
    const dfIII = createRef<DataFigure>();
    graphRefIII().container.add(<DataFigure ref={dfIII} data={signalIII} place={blueCircle} tweenShape={(shape) => shape.size([20, 20], .2)}></DataFigure>)
    yield* tween(2.5, (value, time) => {
        const idx: number = Math.ceil(map(0, setIII.length, value));
        signalIII(setIII.slice(0, idx));
        const children = dfIII().children();
        const circ = children[idx - 1];
        if (!circ) return;
        console.log(circ.absolutePosition());
        spawn(textRefs[2 * (idx + 22) - 2].opacity(0, .1));
        spawn(textRefs[2 * (idx + 22) - 1].opacity(0, .1));
        spawn(textRefs[2 * (idx + 22) - 2].margin([0, 100, 0, -100], .1));
        spawn(textRefs[2 * (idx + 22) - 1].margin([0, 100, 0, -100], .1));

    });
    yield* waitFor(.5);
    yield* beginSlide("4");

    const graphRefIV = createRef<Graph>();
    view.add(<Graph opacity={0} ref={graphRefIV} bounds={{ minX: 0, maxX: 20, minY: 0, maxY: 15 }} graphSize={[600, 400]} position={positions[3]}>
    </Graph>);
    yield* graphRefIV().opacity(1, .5);
    const signalIV = createSignal<SignalValue<PossibleVector2>[]>([]);
    const dfIV = createRef<DataFigure>();
    graphRefIV().container.add(<DataFigure ref={dfIV} data={signalIV} place={blueCircle} tweenShape={(shape) => shape.size([20, 20], .2)}></DataFigure>)
    yield* tween(2.5, (value, time) => {
        const idx: number = Math.ceil(map(0, setIV.length, value));
        signalIV(setIV.slice(0, idx));
        const children = dfIV().children();
        const circ = children[idx - 1];
        if (!circ) return;
        console.log(circ.absolutePosition());
        spawn(textRefs[2 * (idx + 33) - 2].opacity(0, .1));
        spawn(textRefs[2 * (idx + 33) - 1].opacity(0, .1));
        spawn(textRefs[2 * (idx + 33) - 2].margin([0, -100, 0, 100], .1));
        spawn(textRefs[2 * (idx + 33) - 1].margin([0, -100, 0, 100], .1));

    });
    yield* waitFor(.5);
    yield* beginSlide("5");
})