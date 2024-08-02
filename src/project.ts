import {makeProject} from '@motion-canvas/core';
import projectionData from "./data/emmision_projection.json"

import example from './scenes/example?scene';
import mainscene from './scenes/mainscene?scene';
import graph from './scenes/graph?scene';
import projection from './scenes/projection?scene'
import why from "./scenes/why?scene"
import fault from "./scenes/faultInOurLines?scene"
import sinCosCircle from './scenes/sinCosCircle?scene';
import barchart from './scenes/barchart?scene';

export default makeProject({
  scenes: [barchart],
});
