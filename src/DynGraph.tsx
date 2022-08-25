import React, { useCallback, useRef, useEffect } from "react";
import ForceGraph3D, { GraphData, LinkObject, NodeObject } from "react-force-graph-3d";
import { useWindowSize } from "usehooks-ts";
import * as ReactDOMServer from "react-dom/server";

// console.log(typeof ForceGraphMethods);
//TODO wtf
//Turns a link into a tuple of [sourceID, targetID]
function coerceLink(link: LinkObject): [string, string] {
	var src: string;
	if (link.source === undefined) src = "undefined";
	else if (typeof link.source === "string" || typeof link.source === "number")
		src = String(link.source);
	else if (link.source === undefined) src = "undefined";
	else src = String(link.source.id);

	var tgt: string;
	if (link.target === undefined) tgt = "undefined";
	else if (typeof link.target === "string" || typeof link.target === "number")
		tgt = String(link.target);
	else if (link.target === undefined) tgt = "undefined";
	else tgt = String(link.target.id);

	return [src, tgt];
}

function linkID(link: LinkObject): string {
	var tup = coerceLink(link);
	var sortedHeadTail = [tup[0], tup[1]].sort();
	return "".concat(sortedHeadTail[0], "_", sortedHeadTail[1]);
}

// function linkIDUnsorted(link: LinkObject): string {
// 	var tup = coerceLink(link);
// 	return "".concat(tup[0], "_", tup[1]);
// }

type CurveRotFirst = { rot: number; curve: number; isFirst: boolean };
function getCurveAndRotation(link: LinkObject, i: number, allLinks: Array<string>): CurveRotFirst {
	const collator = new Intl.Collator("en", {
		numeric: true,
		sensitivity: "base",
	});
	const tup = coerceLink(link);
	const isAntiAlphabetical = collator.compare(tup[0], tup[1]);
	let numMatches = allLinks.filter((x: string) => x === linkID(link)).length;
	let numBefore = allLinks.slice(0, i).filter((x: string) => x === linkID(link)).length;

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
		curve = 1;
	}

	return { rot: rot, curve: curve, isFirst: numBefore === 0 };
}

//Components TODO? new file
const NodeLabel = (props: { node: any }) => {
	return (
		<div className="nodeLabel">
			<b>{props.node.name}</b>
			<p />
			{props.node.id}: {props.node.desc}.
		</div>
	);
};

const LinkLabel = (props: { link: any; nodeList: Array<NodeObject> }) => {
	return (
		<div className="linkLabel">
			<b>
				{props.link.source.name} ⟶ {props.link.target.name}
			</b>
			<p />
			<b>
				Site: {props.link.substratePhosphosite}{" "}
				{props.link.effectCode !== "" && <>Effect: {props.link.effectCode}</>}
			</b>
			<p />
			{props.link.fullPhosphorylationEffect}.
		</div>
	);
};

const DynamicGraph = (props: {
	graphData: GraphData;
	showSelfLoops: boolean;
	curveAmount: number;
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

	const attrs = useRef<any>();
	useEffect(() => {
		const allLinks = props.graphData.links.map((l) => linkID(l));

		let arrayAttrs = props.graphData.links.map((l, i) => {
			let curRot = getCurveAndRotation(l, i, allLinks);
			return { index: i, curve: curRot.curve, rot: curRot.rot, firstLink: curRot.isFirst };
		});

		attrs.current = arrayAttrs;
	}, [props.graphData]);

	const isLinkVisible = (link: LinkObject, isFirstLink: boolean) => {
		let canVis = link.source !== link.target || props.showSelfLoops;
		if (props.curveAmount > 0) return canVis;
		return (isFirstLink || link.source === link.target) && canVis;
	};

	const { width, height } = useWindowSize();

	return (
		<ForceGraph3D
			//Basic Props
			graphData={props.graphData}
			ref={fgRef}
			width={width}
			height={height}
			//Node props
			nodeLabel={(n: any) => ReactDOMServer.renderToString(<NodeLabel node={n} />)}
			onNodeClick={handleNodeClick}
			//Link props
			linkLabel={(l: any) =>
				ReactDOMServer.renderToString(
					<LinkLabel link={l} nodeList={props.graphData.nodes} />
				)
			}
			// linkHoverPrecision={}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkCurvature={(l: LinkObject) => {
				let c = attrs.current[props.graphData.links.indexOf(l)].curve;
				c = Math.max((c * props.curveAmount) / 100, l.source !== l.target ? 0 : 0.2);
				return c;
			}}
			linkCurveRotation={(l: LinkObject) =>
				attrs.current[props.graphData.links.indexOf(l)].rot
			}
			linkVisibility={(l: LinkObject) =>
				isLinkVisible(l, attrs.current[props.graphData.links.indexOf(l)].firstLink)
			}
		/>
	);
};
export default DynamicGraph;
