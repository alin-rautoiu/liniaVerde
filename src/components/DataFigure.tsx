import { codeSignal, computed, Layout, LayoutProps, Rect, signal, Node, Curve, Spline, Circle, Shape, Knot, nodeName } from "@motion-canvas/2d";
import { Graph } from "./Graph";
import { createDeferredEffect, createEffect, createSignal, easeInBack, easeOutSine, map, PossibleVector2, range, remap, SignalValue, SimpleSignal, spawn, ThreadGenerator, unwrap, Vector2 } from "@motion-canvas/core";


export interface DataFigureProps extends LayoutProps {
    mapPosition?: any;
    node?: Node
    data: SignalValue<SignalValue<PossibleVector2>[]>
    place?(pos?: Vector2, idx?: number, maxCount?: number): Node
    plotGenerator?: SignalValue<Spline>
    valueBounds?: SignalValue<ValueBounds>
    tweenShape?: (figure: Shape) => ThreadGenerator
}

export interface ValueBounds {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

@nodeName("Data Figure")
export class DataFigure extends Layout {

    @signal()
    public declare readonly data: SimpleSignal<SignalValue<PossibleVector2>[], this>

    @signal()
    public declare readonly plotGenerator: SimpleSignal<Spline, this>

    @signal()
    public declare readonly valueBounds: SimpleSignal<ValueBounds, this>

    public tweenShape?: (figure: Shape) => ThreadGenerator;
    mapPosition: any;

    @computed()
    public parsedPoints(): Vector2[] {
        return this.data().map(signal => new Vector2(unwrap(signal)));
    }

    @computed()
    public getParent(): Layout {
        const parent = this.findAncestor<Layout>(n => true);
        return parent;
    }

    @computed()
    public parentBottomLeft() {
        return this.getParent().bottomLeft();
    }

    @computed()
    public parentBottomRight() {
        return this.getParent().bottomRight();
    }

    @computed()
    public parentTopLeft() {
        return this.getParent().topLeft();
    }

    @computed()
    public parentTopRight() {
        return this.getParent().topRight();
    }

    plot: Spline;

    private parsePoint(signal: SignalValue<PossibleVector2>) {
        return new Vector2(unwrap(signal));
    }

    public constructor(props?: DataFigureProps) {
        super({ ...props });
        this.tweenShape = props.tweenShape;

        const figures: Node[] = [];
        const points: Vector2[] = [];

        if (this.plotGenerator) {
            this.plot = this.plotGenerator();
            this.add(this.plot);
        }

        this.mapPosition = props.mapPosition;

        const pointsSignal = createSignal(range(10).map(() => new Vector2()));

        if (this.plot) {
            this.plot.points(() => pointsSignal());
        }
        createDeferredEffect(() => {
            if (!this.valueBounds()) return;

            if (props.place && this.tweenShape) {

                let i = figures.length;

                //TODO: Se incurca la seturi noi de aceeasi lungime, trebuie identificator
                for (; i < this.parsedPoints().length; i++) {
                    const v = this.parsedPoints()[i];
                    var figure = props.place(v) as Shape;
                    figures.push(figure);
                    this.add(figure);
                    figure.position(() => this.mapPosition(v));

                    if (this.tweenShape) {
                        figure.size([0, 0]);
                        spawn(() => this.tweenShape(figure));
                    }
                }

                for (; i > this.parsedPoints().length; i--) {
                    const fig = figures.pop() as Shape;
                    spawn(fig.size(0, .3).do(() => fig.remove().dispose()));
                }
            } else if (props.place && ! this.tweenShape) { //Workaround situational pentru ce e mai sus
                figures.map(f => f.remove());
                this.parsedPoints().map(p => {
                    const v = this.mapPosition(p);
                    const figure = props.place(v) as Shape;
                    figures.push(figure);
                    this.add(figure);
                    figure.position(() => v);
                })
            }

            if (this.plot) {
                const mappedPoints = this.parsedPoints().map(p => this.mapPosition(p));
                pointsSignal(mappedPoints);
            }
        })

    }
}