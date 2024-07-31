import { Circle, ComponentChildren, computed, Grid, Layout, LayoutProps, Node, nodeName, NodeProps, Ray, Rect, Shape, ShapeProps, signal, Spline, Txt } from "@motion-canvas/2d";
import { Color, createDeferredEffect, createEffect, createRef, createSignal, map, PossibleColor, PossibleVector2, range, remap, SignalValue, SimpleSignal, sin, spawn, tween, unwrap, Vector2, Vector2Signal } from "@motion-canvas/core";
import { DataFigure, ValueBounds } from "./DataFigure";

export interface GraphProps extends LayoutProps {
    node?: Node
    bounds?: SignalValue<ValueBounds>
    ticks?: Boolean,
    graphSize?: SignalValue<PossibleVector2>
    xLabel?: string | (() => string),
    yLabel?: string | (() => string),
    yTickGenerator?: (number: number) => string
}

@nodeName('Graph')
export class Graph extends Layout {

    @signal()
    public declare readonly bounds: SimpleSignal<ValueBounds, this>

    @signal()
    public declare readonly graphSize: Vector2Signal<PossibleVector2, this>

    public container: Layout;

    @computed()
    public getDataBounds(dataFigures?: DataFigure[]): ValueBounds {
        const df = dataFigures ?? this.childrenAs<DataFigure>().filter(c => c != null);
        var childrenPoints = df.flatMap(c => c.parsedPoints());
        var sortedX = childrenPoints.map(p => p.x).sort((a, b) => a - b);
        var sortedY = childrenPoints.map(p => p.y).sort((a, b) => a - b);
        return {
            minX: sortedX[0],
            minY: sortedY[0],
            maxX: sortedX[sortedX.length - 1],
            maxY: sortedY[sortedY.length - 1]
        }
    }

    public constructor(props?: GraphProps) {
        super({ ...props });
        this.container = <Layout clip size={() => this.graphSize()}></Layout> as Layout;

        createDeferredEffect(() => {
            const dataFigures = this.container.childrenAs<DataFigure>().filter(c => c != null && c.valueBounds && c.parsedPoints);
            if (dataFigures.length === 0) return;

            if (this.bounds()) {
                const minX = createSignal(() => this.bounds()?.minX ?? 0);
                const minY = createSignal(() => this.bounds()?.minY ?? 0);
                const maxX = createSignal(() => this.bounds()?.maxX ?? 0);
                const maxY = createSignal(() => this.bounds()?.maxY ?? 0);

                dataFigures.map(df => {
                    df.valueBounds(() => this.bounds())
                    df.mapPosition = (v: Vector2) => this.bounds() && v
                        ? new Vector2(
                            remap(minX(), maxX(), this.container.bottomLeft().x, this.container.bottomRight().x, v.x),
                            remap(minY(), maxY(), this.container.bottomLeft().y, this.container.topLeft().y, v.y)
                        )
                        : new Vector2()
                });
            } else {


                dataFigures.map(df => {
                    const minX = createSignal(() => this.getDataBounds(dataFigures)?.minX ?? 0);
                    const minY = createSignal(() => this.getDataBounds(dataFigures)?.minY ?? 0);
                    const maxX = createSignal(() => this.getDataBounds(dataFigures)?.maxX ?? 0);
                    const maxY = createSignal(() => this.getDataBounds(dataFigures)?.maxY ?? 0);
                    df.valueBounds(() => this.getDataBounds(dataFigures))
                    df.mapPosition = (v: Vector2) => this.bounds() && v
                        ? new Vector2(
                            remap(minX(), maxX(), this.container.bottomLeft().x, this.container.bottomRight().x, v.x),
                            remap(minY(), maxY(), this.container.bottomLeft().y, this.container.topLeft().y, v.y)
                        )
                        : new Vector2()
                });
            }

        })

        const yDensity = ((this.container.height() / this.container.width()) * 10);
        const xDensity = ((this.container.width() / this.container.height()) * 10);

        const yLabelsGenerator = props.yTickGenerator
            ? props.yTickGenerator
            : (i: number) => map(this.bounds().minY, this.bounds().maxY, i / yDensity).toString();

        this.add(
            <Layout size={() => this.graphSize()} >
                <Ray from={() => this.container.bottomLeft()} to={() => this.container.topLeft()} stroke={"#FFF"} lineWidth={1} endArrow arrowSize={5}></Ray>
                <Ray from={() => this.container.bottomLeft()} to={() => this.container.bottomRight()} stroke={"#FFF"} lineWidth={1} endArrow arrowSize={5}></Ray>
                <Grid spacing={[this.container.width() / xDensity, this.container.height() / yDensity]} stroke={"#cccccc3d"} width={() => this.container.width()} height={() => this.container.height()}></Grid>
            </Layout>
        )

        if (props.ticks) {

            this.add(<>
                {range(xDensity).map(i => {
                    return <Ray stroke={"white"}
                        lineWidth={1}
                        from={() => Vector2.lerp(this.container.bottomLeft(), this.container.bottomRight(), (i + 1) / xDensity)}
                        to={() => Vector2.lerp(this.container.bottomLeft().addY(10), this.container.bottomRight().addY(10), (i + 1) / xDensity)} ></Ray>
                })}
                {range(yDensity).map(i => {
                    return <Ray stroke={"white"}
                        lineWidth={1}
                        from={() => Vector2.lerp(this.container.bottomLeft(), this.container.topLeft(), (i + 1) / yDensity)}
                        to={() => Vector2.lerp(this.container.bottomLeft().addX(-5), this.container.topLeft().addX(-5), (i + 1) / yDensity)} ></Ray>
                })}
                {range(xDensity).map(i => {
                    return <Txt fill={"white"} fontSize={16} text={() => map(this.bounds().minX, this.bounds().maxX, (i + 1) / xDensity).toFixed(1)}
                        position={() => Vector2.lerp(this.container.bottomLeft().addY(25), this.container.bottomRight().addY(25), (i + 1) / xDensity)}>
                    </Txt>
                })}
                {range(yDensity).map(i => {
                    return <Txt fill={"white"} fontSize={16} text={() => yLabelsGenerator((i + 1))}
                        position={() => Vector2.lerp(this.container.bottomLeft().addX(-30), this.container.topLeft().addX(-30), (i + 1) / yDensity)}>
                    </Txt>
                })}
                <Txt fill={"white"} fontSize={20} position={() => this.container.topLeft().addY(-30)} text={props.yLabel}></Txt>
                <Txt fill={"white"} fontSize={20} position={() => this.container.bottomRight().addX(30)} text={props.xLabel}></Txt>
            </>)
        }

        this.add(this.container);
    }
}