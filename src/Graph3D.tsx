import { MultiDirectedGraph } from "graphology";
import { useCallback, useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import ForceGraph3D, { ForceGraphMethods, NodeObject } from "react-force-graph-3d";
import { ColorScheme } from "./App";
// import * as THREE from "three";

import { GraphData, LinkInput, NodeInput } from "./DynGraph";
import { NodeLabel, LinkLabel } from "./GraphLabels";

export default function Graph3D(props: {
	graphData: GraphData;
	G: MultiDirectedGraph;
	fgRef: React.MutableRefObject<ForceGraphMethods | undefined> | undefined;
	handleNodeRightClick: (node: NodeObject, event: MouseEvent) => void;
	onNodeHoverOff: () => void;
	clickedNode: NodeObject | null;
	width: number;
	height: number;
	showSubstrates: boolean;
	setHoveredNode: any; //(node: NodeInput | null) => void;
	hoveredNode: NodeInput | null;
	setHoveredLink: any; //(link: LinkInput | null) => void;
	hoveredLink: LinkInput | null;
	curveAmount: number;
	showSelfLoops: boolean;
	searchFocused: boolean;
	colorScheme: ColorScheme;
}) {
	const [lastClickedNode, setLastClickedNode] = useState<NodeObject | null>(null);

	const handleNodeClick = useCallback(
		(node) => {
			if (props.fgRef?.current === undefined || !node) {
				if (props.fgRef?.current === undefined) setLastClickedNode(null);
				return;
			}
			setLastClickedNode(node);
			// Aim at node from outside it
			const distance = 40;
			const distRatio = 2 + distance / Math.hypot(node.x, node.y, node.z);

			props.fgRef.current.cameraPosition(
				{ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
				node, // lookAt ({ x, y, z })
				3000 // ms transition duration
			);
		},
		[props.fgRef]
	);

	useEffect(() => {
		handleNodeClick(props.clickedNode);
	}, [props.clickedNode, handleNodeClick]);

	return (
		<ForceGraph3D
			//Basic Props
			backgroundColor={props.colorScheme.background}
			graphData={props.graphData}
			ref={props.fgRef}
			width={props.width}
			height={props.height}
			//
			// Node props
			nodeLabel={(n: any) =>
				props.searchFocused
					? ""
					: renderToString(<NodeLabel node={props.G?.getNodeAttributes(n.id)} />)
			}
			onNodeClick={handleNodeClick}
			onNodeRightClick={props.handleNodeRightClick}
			onNodeHover={(node: NodeObject | null, previousNode: NodeObject | null) => {
				if (previousNode && !node) props.onNodeHoverOff(); //node was just hovered off
				if (!props.searchFocused) props.setHoveredNode(node);
			}}
			nodeAutoColorBy={(n: any) => n.isKinase ? "Kinase" : n.type}
			nodeColor={(n: any) =>{
				return (n === props.hoveredNode || n === lastClickedNode ? props.colorScheme.nodes.selected : props.colorScheme.nodes.byType[n.type]);
			}}
			nodeVisibility={(n: any) =>
				(n.isKinase || props.showSubstrates) &&
				(props.G.getNodeAttribute(n.id, "subgraphVis") ?? false)
			}
			//
			// Link props
			linkLabel={(l: any) =>
				props.searchFocused
					? ""
					: renderToString(<LinkLabel edge={props.G?.getEdgeAttributes(l.key)} />)
			}
			linkHoverPrecision={10}
			linkWidth={(l: any) => {
				let p = props.G?.getEdgeAttribute(l.key, "fc") ?? 0.4;
				return Math.max(0.01, 1.5 * Math.abs(p));
			}}
			onLinkHover={(l: any) => {
				if (!props.searchFocused) props.setHoveredLink(l);
			}}
			linkColor={(l: any) => {
				let hovCol = l === props.hoveredLink ? props.colorScheme.links.selected : props.colorScheme.links.default;
				let fc = props.G?.getEdgeAttribute(l.key, "fc");
				if (fc === undefined) return hovCol;
				return l === props.hoveredLink ? props.colorScheme.links.default : fc > 0 ? props.colorScheme.links.FCup : props.colorScheme.links.FCdown;
			}}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticleWidth={(l: any) =>
				(props.G?.getEdgeAttribute(l.key, "fc") ?? 0.2) * 1
			}
			linkDirectionalParticles={(l: any) => {
				let p = props.G?.getEdgeAttribute(l.key, "fc") ?? 0;
				if (p === 0) return 0;
				return Math.max(0, 3 + p);
			}}
			linkCurvature={(l: any) => {
				return Math.max(
					(props.G?.getEdgeAttribute(l.key, "curve") * props.curveAmount) / 100,
					l.source === l.target ? 0.2 : 0.0
				);
			}}
			linkCurveRotation={(l: any) => props.G?.getEdgeAttribute(l.key, "rotation")}
			linkVisibility={(l: any) => {
				let link = props.G?.getEdgeAttributes(l.key)!;
				let canVis =
					(l.target.isKinase || props.showSubstrates) &&
					(link.source !== link.target || props.showSelfLoops) &&
					(props.G.getEdgeAttribute(l.key, "subgraphVis") ?? false);
				if (props.curveAmount > 0) return canVis;
				return (link.isFirstLink || link.source === link.target) && canVis;
			}}
			linkOpacity={0.5}
			showNavInfo={false}
		/>
	);
}
