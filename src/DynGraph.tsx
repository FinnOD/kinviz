import React, { useState, useRef, useEffect } from "react";
import { useWindowSize } from "usehooks-ts";
import { MultiDirectedGraph } from "graphology";
import { Dropdown } from "antd";

import { FCData } from "./UploadComponent";
import Graph3D from "./Graph3D";
import Graph2D from "./Graph2D";
import NodeMenu from "./NodeMenu";
import { NodeObject } from "react-force-graph-3d";
import { ColorScheme } from "./App";

export type NodeInput = {
	id: string;
	desc: string;
	name: string;
	isKinase: boolean;
	type: string;
};

export type LinkInput = {
	key: string;
	source: string | NodeInput;
	target: string | NodeInput;
	substratePhosphosite: string;
	effectCode: string; // "+" | "-" | "",
	fullPhosphorylationEffect: string;
};

export interface GraphData {
	nodes: NodeInput[];
	links: LinkInput[];
}

function idPair(attr: any): [string, string] {
	let source = typeof attr.source === "string" ? attr.source : attr.source.id;
	let target = typeof attr.target === "string" ? attr.target : attr.target.id;
	return [source, target];
}

function calculateGraphFromData(graphData: GraphData): MultiDirectedGraph {
	let G: MultiDirectedGraph = dataGraphToGraphology(graphData);

	const collator = new Intl.Collator("en", {
		numeric: true,
		sensitivity: "base",
	});

	let beenTo: Array<string> = [];

	G.forEachNode((node) => {
		G.forEachNeighbor(node, (neighbor) => {
			if (beenTo.includes(neighbor)) return;

			let edgeCount = 0;
			G.someEdge(node, neighbor, (edge) => {
				G.setEdgeAttribute(edge, "multiNumber", edgeCount);
				edgeCount++;
			});
			G.someEdge(node, neighbor, (edge) => {
				G.setEdgeAttribute(edge, "multiTotal", edgeCount);
			});
		});

		beenTo.push(node);
	});

	G.updateEachEdgeAttributes((edge, attr, source, target) => {
		const isAntiAlphabetical = collator.compare(source, target);
		const numMatches: number = attr.multiTotal;
		const numBefore: number = attr.multiNumber;

		let curve = 0;
		let rot = 0;
		if (numMatches > 1) {
			curve = 0.5;
			rot = (numBefore / numMatches) * 2 * Math.PI;

			if (isAntiAlphabetical === 1) {
				// if it IS backwards (b -> a) another 180 degree rotation works
				rot = Math.PI - rot;
			}
		}
		if (isAntiAlphabetical === 0) {
			// if self loop
			curve = 0.5;
		}

		return { curve: curve, rotation: rot, isFirstLink: numBefore === 0, ...attr };
	});

	return G;
}

function dataGraphToGraphology(graphData: GraphData): MultiDirectedGraph {
	let G = new MultiDirectedGraph();

	G.import({
		attributes: {
			name: "My Graph",
		},
		options: {
			allowSelfLoops: true,
			multi: true,
			type: "directed",
		},
		nodes: graphData.nodes.map((n) => {
			return { key: n.id, attributes: { ...n } };
		}),
		edges: graphData.links.map((l) => {
			let sourceID = typeof l.source === "string" ? l.source : l.source.id;
			let targetID = typeof l.target === "string" ? l.target : l.target.id;
			return {
				key: l.key,
				source: sourceID,
				target: targetID,
				undirected: false,
				attributes: { ...l },
			};
		}),
	});

	return G;
}

function addFCtoG(G: MultiDirectedGraph, fcData: FCData | undefined): MultiDirectedGraph {
	if (fcData === undefined) {
		G.updateEachEdgeAttributes((edge, attr) => {
			attr.fc = undefined;
			attr.err = undefined;
			return attr;
		});
		return G;
	} else {
		let panSpecificFirst = fcData?.sort((x, y) =>
			x.site === y.site ? 0 : x.site === "Pan-specific" ? -1 : 1
		);

		G.updateEachEdgeAttributes((edge, attr) => {
			let target = idPair(attr)[1];
			let foundFC = panSpecificFirst
				.slice()
				.find((fcEntry: any) => fcEntry.targetid === target);
			let betterMatch = panSpecificFirst
				.slice()
				.find(
					(fcEntry: any) =>
						fcEntry.targetid === target && fcEntry.site === attr.substratePhosphosite
				);
			if (betterMatch !== undefined) foundFC = betterMatch;

			attr.fc = foundFC?.fc;
			attr.err = foundFC?.err;
			return attr;
		});
		return G;
	}
}

function calculateNeighbourVisibility(
	G: MultiDirectedGraph,
	subgraphNode: NodeInput | null
): MultiDirectedGraph {
	G.updateEachEdgeAttributes((edge, attr) => {
		attr.subgraphVis = true;
		return attr;
	});

	G.updateEachNodeAttributes((node, attr) => {
		attr.subgraphVis = true;
		return attr;
	});

	if (subgraphNode !== null) {
		let neighbours: Array<string> = [];
		G.forEachNeighbor(subgraphNode.id, function (neighbor, attributes) {
			neighbours.push(neighbor);
		});

		G.updateEachEdgeAttributes((edge, attr) => {
			attr.subgraphVis = idPair(attr).filter((e) => neighbours.includes(e)).length === 2;
			return attr;
		});

		G.updateEachNodeAttributes((node, attr) => {
			attr.subgraphVis = neighbours.includes(node);
			return attr;
		});
	}

	return G;
}

const DynamicGraph = (props: {
	graphData: GraphData;
	showSelfLoops: boolean;
	curveAmount: number;
	fcData: FCData | undefined;
	is3D: boolean;
	showSubstrates: boolean;
	change3D: (checked: boolean) => void;
	clickedNode: NodeObject | null;
	searchFocused: boolean;
	colorScheme: ColorScheme;
}) => {
	// Node focus magic
	const fgRef = useRef<any>();

	//compute graphData to graphology Graph and set default state to run only first render
	const [graphMix, updateGraphMix] = useState<{ graphData: GraphData; G: MultiDirectedGraph }>(
		() => {
			const newG = calculateGraphFromData(props.graphData);
			const newGSubVis = calculateNeighbourVisibility(newG, null);
			const newGWithFC = addFCtoG(newGSubVis, props.fcData);
			return { graphData: props.graphData, G: newGWithFC };
		}
	);
	useEffect(() => {
		//Generate Graphology representation and layout properties
		setSubgraphNode(null);
		props.change3D(true);
		let newG = calculateGraphFromData(props.graphData);
		let newGSubVis = calculateNeighbourVisibility(newG, null);
		// update the fcLookup for the new dataset
		let newGWithFC = addFCtoG(newGSubVis, props.fcData);

		updateGraphMix({ graphData: props.graphData, G: newGWithFC });
	}, [props.graphData]);
	//ate 'updateGraphMix(g => ...)' if you only
	useEffect(() => {
		if (graphMix?.G === undefined) return;

		let newGWithFC = addFCtoG(graphMix.G.copy(), props.fcData);

		updateGraphMix((prevGraphMix) => {
			return { ...prevGraphMix, G: newGWithFC };
		});
	}, [props.fcData]);

	const [hoveredNode, setHoveredNode] = useState<NodeInput | null>(null);
	const [hoveredLink, setHoveredLink] = useState<LinkInput | null>(null);

	const [rightClickedNode, setRightClickedNode] = useState<NodeInput | null>(null);
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const handleDropdownChange = (visible: boolean) => {
		if (!visible) setDropdownVisible(false);
	};
	const handleNodeRightClick = (node: any) => {
		if (node) {
			setRightClickedNode(node);
			setDropdownVisible(true);
		} else {
			setRightClickedNode(null);
			setDropdownVisible(false);
		}
	};

	const [subgraphNode, setSubgraphNode] = useState<NodeInput | null>(null);
	useEffect(() => {
		let subgraphVisibleG = calculateNeighbourVisibility(graphMix.G.copy(), subgraphNode);

		if (subgraphNode) props.change3D(false);

		updateGraphMix((prevGraphMix) => {
			return { ...prevGraphMix, G: subgraphVisibleG };
		});
	}, [subgraphNode]);

	const { width, height } = useWindowSize();

	if (graphMix?.G === undefined || graphMix?.graphData === undefined) {
		console.log(graphMix);
		console.log("GraphMix undefined, returning <></>");
		return <></>;
	}

	let graphElement = props.is3D ? (
		<Graph3D
			graphData={graphMix.graphData}
			G={graphMix.G}
			fgRef={fgRef}
			handleNodeRightClick={handleNodeRightClick}
			width={width}
			height={height}
			showSubstrates={props.showSubstrates}
			setHoveredNode={setHoveredNode}
			onNodeHoverOff={() => handleNodeRightClick(null)}
			clickedNode={props.clickedNode}
			hoveredNode={hoveredNode}
			setHoveredLink={setHoveredLink}
			hoveredLink={hoveredLink}
			curveAmount={props.curveAmount}
			showSelfLoops={props.showSelfLoops}
			searchFocused={props.searchFocused}
			colorScheme={props.colorScheme}
		/>
	) : (
		<Graph2D
			graphData={graphMix.graphData}
			G={graphMix.G}
			fgRef={fgRef}
			handleNodeRightClick={handleNodeRightClick}
			width={width}
			height={height}
			showSubstrates={props.showSubstrates}
			setHoveredNode={setHoveredNode}
			onNodeHoverOff={() => handleNodeRightClick(null)}
			hoveredNode={hoveredNode}
			setHoveredLink={setHoveredLink}
			hoveredLink={hoveredLink}
			curveAmount={props.curveAmount}
			showSelfLoops={props.showSelfLoops}
			colorScheme={props.colorScheme}
		/>
	);

	return (
		<Dropdown
			overlay={
				<NodeMenu
					targetNode={rightClickedNode}
					selfSetVisible={setDropdownVisible}
					setSubgraphNode={setSubgraphNode}
				></NodeMenu>
			}
			trigger={["contextMenu"]}
			visible={dropdownVisible}
			onVisibleChange={handleDropdownChange}
		>
			<div>{graphElement}</div>
		</Dropdown>
	);
};
export default DynamicGraph;
