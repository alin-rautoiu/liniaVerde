import { Node, NodeProps, Rect } from "@motion-canvas/2d";

export interface BorderProps extends NodeProps {
    node?: Node
}

export class Border extends Node {
    public constructor (props?: BorderProps) {
        super({...props});
        console.log(this.children());
        this.add(<Rect stroke={"white"} width={"100%"} height={"100%"} lineWidth={10} ></Rect>)
    }
}