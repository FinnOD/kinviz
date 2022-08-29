import React, { useState, useCallback, useRef, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { useWindowSize } from "usehooks-ts";
import { renderToString } from "react-dom/server";

import { FCData } from "./UploadComponent";
import { MultiDirectedGraph } from "graphology";

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

//Components TODO? new file
function NodeLabel(props: { node: any }): any {
	return (
		<div className="nodeLabel">
			<b>{props.node.name}</b>
			<p />
			{props.node.id}: {props.node.desc}.
		</div>
	);
}

function LinkLabel(props: { edge: any }): any {
	let source = typeof props.edge.source === "string" ? props.edge.source : props.edge.source.name;
	let target = typeof props.edge.target === "string" ? props.edge.target : props.edge.target.name;

	return (
		<div className="linkLabel">
			<b>
				{source} ⟶ {target}
				<br />
				{props.edge.fc !== undefined && (
					<>FC: {Math.round((props.edge.fc + Number.EPSILON) * 100) / 100}</>
				)}
				<br />
				Site: {props.edge.substratePhosphosite}{" "}
				{props.edge.effectCode !== "" && <>Effect: {props.edge.effectCode}</>}
			</b>
			<p />
			{props.edge.fullPhosphorylationEffect}
		</div>
	);
}

function idPair(attr: any): [string, string] {
	let source = typeof attr.source === "string" ? attr.source : attr.source.id;
	let target = typeof attr.target === "string" ? attr.target : attr.target.id;
	return [source, target];
}

function calculateCurveRotVis(G: MultiDirectedGraph): any {
	function linkID(attr: any): string {
		let sorted = idPair(attr).sort();
		return "".concat(sorted[0], "_", sorted[1]);
	}

	const collator = new Intl.Collator("en", {
		numeric: true,
		sensitivity: "base",
	});

	let allLinks = G.mapEdges((edge, attr) => linkID(attr));

	let i = 0;
	G.updateEachEdgeAttributes((edge, attr) => {
		const [source, target] = idPair(attr);
		const isAntiAlphabetical = collator.compare(source, target);
		let numMatches = allLinks.filter((x: string) => x === linkID(attr)).length;
		let numBefore = allLinks.slice(0, i).filter((x: string) => x === linkID(attr)).length;

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

		i += 1;
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

type FCLookup = { [key: string]: { fc: number; err: number } };
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

const DynamicGraph = (props: {
	graphData: GraphData;
	showSelfLoops: boolean;
	curveAmount: number;
	fcData: FCData | undefined;
}) => {
	//Node focus magic
	const fgRef = useRef<any>();
	const handleNodeClick = useCallback(
		(node) => {
			if (fgRef.current === undefined) return;

			// Aim at node from outside it
			const distance = 40;
			const distRatio = 2 + distance / Math.hypot(node.x, node.y, node.z);

			fgRef.current.cameraPosition(
				{ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
				node, // lookAt ({ x, y, z })
				3000 // ms transition duration
			);
		},
		[fgRef]
	);

	//compute graphData to graphology Graph
	const [G, updateG] = useState<MultiDirectedGraph>();
	// edgeKey lookup for fc data
	// TODO put into G
	// const [fcLookup, setFCLookup] = useState<FCLookup | undefined>();
	useEffect(() => {
		//Generate Graphology representation and layout properties
		let newG = calculateCurveRotVis(dataGraphToGraphology(props.graphData).copy());

		// update the fcLookup for the new dataset
		let newGWithFC = addFCtoG(newG.copy(), props.fcData);

		updateG(newGWithFC);
	}, [props.graphData]);

	useEffect(() => {
		if (G === undefined) return;

		let newGWithFC = addFCtoG(G.copy(), props.fcData);

		updateG(newGWithFC);
	}, [props.fcData]);

	const [hoveredNode, setHoveredNode] = useState(null);
	const [hoveredLink, setHoveredLink] = useState(null);

	const { width, height } = useWindowSize();

	return (
		<ForceGraph3D
			//Basic Props
			backgroundColor={"#0f1320"}
			graphData={props.graphData}
			ref={fgRef}
			width={width}
			height={height}
			//
			// Node props
			nodeLabel={(n: any) => renderToString(<NodeLabel node={G?.getNodeAttributes(n.id)} />)}
			onNodeClick={handleNodeClick}
			onNodeHover={(n: any) => setHoveredNode(n)}
			nodeColor={(n: any) => (n === hoveredNode ? "#FF964D" : "#F0B648")}
			//
			// Link props
			linkLabel={(l: any) => renderToString(<LinkLabel edge={G?.getEdgeAttributes(l.key)} />)}
			linkHoverPrecision={10}
			linkWidth={(l: any) => {
				let p = G?.getEdgeAttribute(l.key, "fc") ?? 0.4;
				return Math.max(0.01, 2 * Math.abs(p));
			}}
			onLinkHover={(l: any) => setHoveredLink(l)}
			linkColor={(l: any) => {
				let hovCol = l === hoveredLink ? "#FF964D" : "#9DAABC";
				let fc = G?.getEdgeAttribute(l.key, "fc");
				if (fc === undefined) return hovCol;
				return l === hoveredLink ? "#F0B648" : fc > 0 ? "#FF964D" : "#2A729A";
			}}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticles={(l: any) => {
				let p = G?.getEdgeAttribute(l.key, "fc") ?? 0;
				if (p === 0) return 0;
				return Math.max(0, 3 + p);
			}}
			linkCurvature={(l: any) => {
				return Math.max(
					(G?.getEdgeAttribute(l.key, "curve") * props.curveAmount) / 100,
					l.source === l.target ? 0.2 : 0.0
				);
			}}
			linkCurveRotation={(l: any) => G?.getEdgeAttribute(l.key, "rotation")}
			linkVisibility={(l: any) => {
				let link = G?.getEdgeAttributes(l.key)!;
				// if(link === undefined){ return true};
				let canVis = link.source !== link.target || props.showSelfLoops;
				if (props.curveAmount > 0) return canVis;
				return (link.isFirstLink || link.source === link.target) && canVis;
			}}
			linkOpacity={0.5}
		/>
	);
};
export default DynamicGraph;
