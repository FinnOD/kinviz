import { MultiDirectedGraph } from "graphology";
import { renderToString } from "react-dom/server";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";

import { GraphData, LinkInput, NodeInput } from "./DynGraph";
import { NodeLabel, LinkLabel } from "./GraphLabels";

export default function Graph2D(props: {
	graphData: GraphData;
	G: MultiDirectedGraph;
	fgRef: React.MutableRefObject<ForceGraphMethods | undefined> | undefined;
	width: number;
	height: number;
	setHoveredNode: any; //(node: NodeInput | null) => void;
	hoveredNode: NodeInput | null;
	setHoveredLink: any; //(link: LinkInput | null) => void;
	hoveredLink: LinkInput | null;
	curveAmount: number;
	showSelfLoops: boolean;
}) {
	return (
		<ForceGraph2D
			//Basic Props
			backgroundColor={"#0f1320"}
			graphData={props.graphData}
			ref={props.fgRef}
			width={props.width}
			height={props.height}
			
			// Node props
			nodeLabel={(n: any) =>
				renderToString(<NodeLabel node={props.G.getNodeAttributes(n.id)} />)
			}
			onNodeClick={(e) => {}} //TODO
			onNodeHover={(n) => props.setHoveredNode(n)}
			nodeColor={(n: any) => (n === props.hoveredNode ? "#FF964D" : "#F0B648")}
			//
			// Link props
			linkLabel={(l: any) =>
				renderToString(<LinkLabel edge={props.G.getEdgeAttributes(l.key)} />)
			}
			linkHoverPrecision={10}
			linkWidth={(l: any) => {
				let p = props.G.getEdgeAttribute(l.key, "fc") ?? 0.4;
				return Math.max(0.01, 2 * Math.abs(p));
			}}
			onLinkHover={(l: any) => props.setHoveredLink(l)}
			linkColor={(l: any) => {
				let hovCol = l === props.hoveredLink ? "#FF964D" : "#9DAABC";
				let fc = props.G.getEdgeAttribute(l.key, "fc");
				if (fc === undefined) return hovCol;
				return l === props.hoveredLink ? "#F0B648" : fc > 0 ? "#FF964D" : "#2A729A";
			}}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticles={(l: any) => {
				let p = props.G.getEdgeAttribute(l.key, "fc") ?? 0;
				if (p === 0) return 0;
				return Math.max(0, 3 + p);
			}}
			linkCurvature={(l: any) => {
				return Math.max(
					(props.G.getEdgeAttribute(l.key, "curve") * props.curveAmount) / 100,
					l.source === l.target ? 0.2 : 0.0
				);
			}}
			linkVisibility={(l: any) => {
				let link = undefined 
				// try{
				link = props.G.getEdgeAttributes(l.key)!;
				// }
				// catch{ debugger;}
				// return true;
				// if(link === undefined){ return true};
				let canVis = link.source !== link.target || props.showSelfLoops;
				if (props.curveAmount > 0) return canVis;
				return (link.isFirstLink || link.source === link.target) && canVis;
			}}
		/>
	);
}
