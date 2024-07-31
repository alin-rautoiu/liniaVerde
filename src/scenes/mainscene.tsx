import { Latex, Layout, makeScene2D } from "@motion-canvas/2d";
import { all, createRef, makeRef, sequence, waitFor } from "@motion-canvas/core";

export default makeScene2D(function* (view) {
    const tex1 = createRef<Latex>();
    const tex2 = createRef<Latex>();
    const tex3 = createRef<Latex>();
    const tex4 = createRef<Latex>();

    
    view.add(
        <Layout layout height={"100%"} direction={"column"} alignContent={"center"} alignItems={"start"} justifyContent={"center"} rowGap={60}>
    <Latex height={"15%"} ref={tex1} tex="{\large \color{white}{\nabla\cdot E = \frac{\rho}{\varepsilon_0}}}"></Latex>
    <Latex height={"15%"} ref={tex2} tex="{\tiny \color{white}{\nabla\times B = 0 \color{transparent}{\frac{1}{1}}}}"></Latex>
    <Latex height={"15%"} ref={tex3} tex="{\large \color{white}{\nabla\cdot E = \frac{\partial B}{\partial t}}}"></Latex>
    <Latex height={"15%"} ref={tex4} tex="{\large \color{white}{\nabla\times B = \mu_0 \left( J + \varepsilon_0 \frac{\partial E}{\partial t} \right) }}"></Latex>
    </Layout>)
        
    tex1().opacity(0);
    tex2().opacity(0);
    tex3().opacity(0);
    tex4().opacity(0);

    yield* sequence(.6,
        tex1().opacity(1, 1),
        tex2().opacity(1, 1),
        tex3().opacity(1, 1),
        tex4().opacity(1, 1),)

    yield* waitFor(.1);

    yield* all(
        tex1().height("30%", 1),
        tex2().height("10%", 1),
        tex3().height("10%", 1),
        tex4().height("10%", 1),
    )
});