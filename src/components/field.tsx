import { Circle, Layout, Line, Node, NodeProps, Ray, View2D, initial, signal } from "@motion-canvas/2d";
import { SignalValue, SimpleSignal, Vector2, all, chain, clamp, createEffect, createRef, createSignal, linear, loop, makeRef, range, tween, useLogger } from "@motion-canvas/core";
import { Charge } from "../scenes/example";

export interface FieldProps extends NodeProps {
    fieldDensity?: SignalValue<number>;
}

export class Field extends Node {

    @initial(20)
    @signal()
    public declare readonly fieldDensity: SimpleSignal<number, this>;

    public constructor(props?: FieldProps) {
        super({ ...props, });
    }

    public *startPlaying() {
        const chargePos = createRef<Circle>();
        const chargeNeg = createRef<Circle>();
        const container = createRef<Layout>();
        const vectorLayer = createRef<Layout>();
        const vectorLayer1 = createRef<Layout>();
        const vectorLayer2 = createRef<Layout>();
        const vectorLayer3 = createRef<Layout>();
        const trajectory = createRef<Circle>();

        function dipFieldAtPoint(p: Vector2, qPos: Vector2, qNeg: Vector2): Vector2 {
            const v1 = qPos;
            const v2 = qNeg;
            const diff = v1.sub(v2);

            const e1 = fieldAtPoint(p, qPos);
            const e2 = fieldAtPoint(p, qNeg);
            const e = e1.sub(e2);

            return e;
        }

        function fieldAtPoint(p: Vector2, qPos: Vector2): Vector2 {

            const diff = p.sub(qPos);
            const e = diff.div(diff.magnitude * diff.magnitude).scale((1 / (4 / Math.PI)));

            return e;
        }

        const q1: Charge = {
            position: new Vector2(0, 0),
            charge: 1
        }

        const q2: Charge = {
            position: new Vector2(0, 0),
            charge: 1
        }

        const field = createSignal(() => {
            points.map((p, idx) => {

                const e = dipFieldAtPoint(p, chargePos().position(), chargeNeg().position());
                vectorLines[idx].from(e.normalized.scale(clamp(5, 50, e.magnitude * 10000)).add(p));

                const epos = fieldAtPoint(p, chargePos().position());
                vectorLines1[idx].from(epos.normalized.scale(clamp(5, 50, epos.magnitude * 10000)).add(p));

                const eneg = fieldAtPoint(p, chargeNeg().position());
                vectorLines2[idx].to(eneg.normalized.scale(clamp(5, 50, eneg.magnitude * 10000)).add(p));
            })
        })

        const vectorLines: Ray[] = [];
        const vectorLines1: Ray[] = [];
        const vectorLines2: Ray[] = [];
        const height = this.view().height();
        const width = this.view().width();

        const cols = this.fieldDensity();
        const rows = height / width * cols;

        const hUnit = height / rows;
        const vUnit = width / cols;
        const points: Vector2[] = [];

        this.add(<Layout ref={container}></Layout>);
        container().add(<Layout ref={vectorLayer}></Layout>);
        container().add(<Layout ref={vectorLayer1}></Layout>);
        container().add(<Layout ref={vectorLayer2}></Layout>);
        container().add(<Layout ref={vectorLayer3}></Layout>);
        container().add(<Circle ref={chargePos} size={160} position={() => q1.position} fill={'#ff6a50'} />);
        container().add(<Circle ref={chargeNeg} size={160} position={() => q2.position} fill={'#50d6ff'} />);
        container().add(<Circle ref={trajectory} height={600} width={600}></Circle>)

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = (-width / 2) + (i * hUnit) + 0.5 * hUnit;
                const y = -height / 2 + (j * vUnit) + 0.20 * vUnit;

                const q2Pos = new Vector2(x, y);
                const r = chargePos().position().sub(q2Pos);

                points.push(r);
            }
        }


        vectorLayer().add(<>{points.map((p, idx) => <Ray startArrow arrowSize={8} ref={makeRef(vectorLines, idx)} stroke={"white"} lineWidth={2} from={p} to={p}></Ray>)}</>)
        vectorLayer1().add(<>{points.map((p, idx) => <Ray startArrow arrowSize={8} ref={makeRef(vectorLines1, idx)} stroke={"#ff6a50"} lineWidth={2} from={p} to={p}></Ray>)}</>)
        vectorLayer2().add(<>{points.map((p, idx) => <Ray startArrow arrowSize={8} ref={makeRef(vectorLines2, idx)} stroke={"#50d6ff"} lineWidth={2} from={p} to={p}></Ray>)}</>)

        createEffect(() => {
            field();
        })


        yield vectorLayer2().opacity(0, 0).to(0, 2).to(1, 1).to(1, 3).to(0, 2);
        yield vectorLayer1().opacity(1, 6).to(0, 2);
        yield chargeNeg().opacity(0, 0).to(0, 2).to(1, 2);

        yield vectorLayer().opacity(0, 0).to(0, 6).to(1, 2);

        yield* tween(15, value => {
            chargePos().position(trajectory().getPointAtPercentage(value).position);
            chargeNeg().position(trajectory().getPointAtPercentage((value + .5) % 1).position);
        })

        yield* all(
            chargePos().position([300, 0], 1),
            chargeNeg().position([-300, 0], 1)
        );

        const chargePoints: SimpleSignal<Vector2>[][] = [];

        const lineRefs: Line[] = [];

        const numLines = 24

        range(numLines).map(idx => {
            const currChargePoints: SimpleSignal<Vector2>[] = [];
            chargePoints.push(currChargePoints);
            const cadran = 2 * idx / (numLines) * Math.PI;
            let firstPoint = createSignal(new Vector2(chargePos().position().x + (chargePos().width() / 2 * Math.sin(cadran)), chargePos().position().y + (chargePos().width() / 2 * Math.cos(cadran))));
            console.log(firstPoint());
            currChargePoints.push(firstPoint);
            let lastPoint = currChargePoints[currChargePoints.length - 1];
            const outsideBounds: SimpleSignal<Vector2>[] = [];
            while (currChargePoints.length < 1000 && lastPoint().sub(chargeNeg().position()).magnitude > 50) {
                const displacement = dipFieldAtPoint(lastPoint(), chargePos().position(), chargeNeg().position()).scale(5000);
                lastPoint = createSignal(lastPoint().add(displacement));
                if (lastPoint().x > this.view().width() / 2) {
                    outsideBounds.push(createSignal(new Vector2(-this.view().width() / 2, lastPoint().y)));
                    break;
                }
                if (lastPoint().y > (this.view().height() / 2)) {
                    outsideBounds.push(createSignal(new Vector2(-lastPoint().x, this.view().height() / 2)));
                    break;
                }
                if (lastPoint().y < -(this.view().height() / 2)) {
                    outsideBounds.push(createSignal(new Vector2(-lastPoint().x, -this.view().height() / 2)));
                    break;
                }
                currChargePoints.push(lastPoint);
            }

            let reenterPoint: SimpleSignal<Vector2> = outsideBounds[0];
            const logger = useLogger();
            logger.debug({
                message: "Reenter point",
                object: {
                    outsideBounds
                }
            })

            logger.debug({
                message: "View Width",
                object: {
                    viewWidt: this.view().width()
                }
            })

            if (outsideBounds.length > 0) {
                while (outsideBounds.length < 1000 && reenterPoint().sub(chargeNeg().position()).magnitude > 50) {
                    const displacement = dipFieldAtPoint(reenterPoint(), chargePos().position(), chargeNeg().position()).scale(5000);
                    reenterPoint = createSignal(reenterPoint().add(displacement));
                    outsideBounds.push(reenterPoint);
                }
                chargePoints.push(outsideBounds);
            }
        })

        const fieldLines = createSignal(() => {
            chargePoints.map((cp, idx) => {
                const cadran = 2 * idx / (numLines) * Math.PI;
                const fp = cp[0];
                fp(new Vector2(chargePos().position().x + (chargePos().width() / 2 * Math.sin(cadran)), chargePos().position().y + (chargePos().width() / 2 * Math.cos(cadran))));
                cp.map((pts, idx) => {
                    if (idx == 0) return;
                    const lastPoint = cp[idx - 1];
                    const displacement = dipFieldAtPoint(lastPoint(), chargePos().position(), chargeNeg().position()).scale(5000);
                    pts(lastPoint().add(displacement));
                })
            })
        })

        chargePoints.map((pts, idx) => {
            vectorLayer3().add(<Line ref={makeRef(lineRefs, idx)} points={() => pts} end={0} stroke={"white"} lineWidth={2}></Line>)
        })

        yield vectorLayer().opacity(.1, .5);

        yield* loop(3, () => {
            return all(...lineRefs.map(l => chain(
                all(
                    l.end(1, 2, linear),
                    l.start(0, 1.5).to(1, 1.5, linear),
                )
                ,
                all(
                    l.end(0, 0),
                    l.start(0, 0)
                )
            )));
        });

        yield* all(...lineRefs.map(l => chain(all(
            l.end(1, 2, linear),
        ))));
    }
}