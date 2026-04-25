"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskGraph = maskGraph;
const shuffle_1 = require("./shuffle");
function maskGraph(graph, seed) {
    const componentNodes = graph.nodes.filter((n) => n.type === 'component');
    const blankCount = Math.floor(componentNodes.length / 2);
    const effectiveSeed = seed ?? String(Date.now());
    const shuffled = (0, shuffle_1.seededShuffle)(componentNodes, effectiveSeed);
    const blankIds = new Set(shuffled.slice(0, blankCount).map((n) => n.id));
    const maskedNodes = graph.nodes.map((n) => {
        if (blankIds.has(n.id)) {
            return {
                id: n.id,
                type: 'blank',
                position: n.position,
                data: { isBlank: true },
            };
        }
        return {
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
        };
    });
    return {
        nodes: maskedNodes,
        edges: graph.edges,
    };
}
//# sourceMappingURL=mask.js.map