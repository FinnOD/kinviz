import React, { useState, useCallback, useRef, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { useWindowSize } from "usehooks-ts";
import {renderToString} from "react-dom/server";

import { FCData, FCEntry } from "./UploadComponent";

export type NodeObject = object & {
	id?: string | number;
	x?: number;
	y?: number;
	z?: number;
	vx?: number;
	vy?: number;
	vz?: number;
	fx?: number;
	fy?: number;
	fz?: number;
};

export type LinkObject = object & {
	source?: string | number | NodeObject;
	target?: string | number | NodeObject;
	substratePhosphosite?: string;
};

export interface MyGraphData {
	nodes: NodeObject[];
	links: LinkObject[];
}

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

const LinkLabel = (props: { link: any; nodeList: Array<NodeObject>, linkAttr: any}) => {

	return (
		<div className="linkLabel">
			<b>
				
				{props.link.source.name} ⟶ {props.link.target.name}
				<br/>
				{props.linkAttr.fc !== undefined && <>FC: {Math.round((props?.linkAttr?.fc + Number.EPSILON) * 100) / 100}</>}
				<br/>
				Site: {props.link.substratePhosphosite}{" "}
				{props.link.effectCode !== "" && <>Effect: {props.link.effectCode}</>}
			</b>
			<p />
			{props.link.fullPhosphorylationEffect}
		</div>
	);
};

type LinkAttrs = Array<{
	index: number;
	curve: number;
	rot: number;
	firstLink: boolean;
	fc?: number;
	err?: number;
}>;

const DynamicGraph = (props: {
	graphData: MyGraphData;
	showSelfLoops: boolean;
	curveAmount: number;
	fcData: FCData | undefined;
}) => {
	// console.log('render graph');
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
	

	
	// Handle graph change and calculate edge curve, rotation and visiblity
	const [attrs, updateAttrs] = useState<LinkAttrs>();
	useEffect(() => {
		const allLinks = props.graphData.links.map((l) => linkID(l));

		let arrayAttrs = props.graphData.links.map((l, i) => {
			let curRot = getCurveAndRotation(l, i, allLinks);
			return { index: i, curve: curRot.curve, rot: curRot.rot, firstLink: curRot.isFirst };
		});

		updateAttrs(arrayAttrs);
	}, [props.graphData]);

	// Handle fcData input and removal
	useEffect(() => {
		console.log(attrs === undefined, props.graphData === undefined, props.fcData === undefined)
		if (
			attrs === undefined ||
			props.graphData === undefined
		)
			return;
		
		if(props.fcData === undefined){
			let arrayAttrs = attrs.map((l) => {
				return { fc: undefined, err: undefined, ...l };
			});
			updateAttrs(arrayAttrs);
			console.log('returning empty fc attrs');
			console.log(attrs);
			return;
		}
		
		let panSpecificFirst = props.fcData.sort((x, y) =>
			x.site === y.site ? 0 : x.site === "Pan-specific" ? -1 : 1
		);

		let arrayAttrs = attrs.map((l) => {
			let tgt:any = props.graphData.links[l.index].target;
			let site = props.graphData.links[l.index].substratePhosphosite;
			let foundFC: FCEntry | undefined = panSpecificFirst
				.slice()
				// .reverse()
				.find((fcEntry) => fcEntry.targetid === tgt.id);
			let betterMatch: FCEntry | undefined = panSpecificFirst
				.slice()
				// .reverse()
				.find((fcEntry) => fcEntry.targetid === tgt.id && fcEntry.site === site);
			if (betterMatch !== undefined) foundFC = betterMatch;
		
			return { fc: foundFC?.fc, err: foundFC?.err, ...l };
		});

		updateAttrs(arrayAttrs)
		console.log('returning full fc attrs');
		console.log(attrs);
		return;
	}, [props.fcData, props.graphData]);

	const isLinkVisible = (link: LinkObject, isFirstLink: boolean) => {
		let canVis = link.source !== link.target || props.showSelfLoops;
		if (props.curveAmount > 0) return canVis;
		return (isFirstLink || link.source === link.target) && canVis;
	};

	const [hoveredNode, setHoveredNode] = useState<NodeObject | null>(null);
	const [hoveredLink, setHoveredLink] = useState<LinkObject | null>(null);

	const { width, height } = useWindowSize();

	return (
		<ForceGraph3D
			//Basic Props
			backgroundColor="#0f1320"
			graphData={props.graphData}
			ref={fgRef}
			width={width}
			height={height}
			//Node props
			nodeLabel={(n: any) => renderToString(<NodeLabel node={n} />)}
			onNodeClick={handleNodeClick}
			onNodeHover={(n: NodeObject | null) => setHoveredNode(n)}
			nodeColor={(n: NodeObject | null) => (n === hoveredNode ? "#FF964D" : "#F0B648")}
			//Link props
			linkLabel={(l: any) => {
				let outAttr = undefined;
				if(attrs  !== undefined)
					outAttr = attrs[props.graphData.links.indexOf(l)];

				return renderToString(
					<LinkLabel link={l} linkAttr={outAttr} nodeList={props.graphData.nodes} />
				)}
			}
			linkHoverPrecision={5}
			linkWidth={(l: LinkObject) => {
				if (attrs === undefined) return 2;
				let p = attrs[props.graphData.links.indexOf(l)].fc?? 0.2;
				return Math.max(0.01, 2*Math.abs(p));
			}}
			onLinkHover={(l: LinkObject | null) => setHoveredLink(l)}
			linkColor={(l: LinkObject) => {
				let hovCol = (l === hoveredLink ? "#FF964D" : "#9DAABC")
				if (attrs === undefined)
					return hovCol;
				let fc = attrs[props.graphData.links.indexOf(l)].fc;
				if(fc === undefined)
					return hovCol;
				return (l === hoveredLink) ? '#F0B648' : (fc > 0)? '#FF964D' : '#2A729A';
			}}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkDirectionalParticles=
				{(l: LinkObject) => {
					if (attrs === undefined) return 0;
					let p = attrs[props.graphData.links.indexOf(l)].fc?? 0;
					if(p ===0 )return 0;
					return Math.max(0, 3+p);
				}}
			
			linkCurvature={(l: LinkObject) => {
				if (attrs === undefined) return props.curveAmount / 100;
				let c = attrs[props.graphData.links.indexOf(l)].curve;
				c = Math.max((c * props.curveAmount) / 100, l.source !== l.target ? 0 : 0.2);
				return c;
			}}
			linkCurveRotation={(l: LinkObject) => {
				if (attrs === undefined) return 0;
				return attrs[props.graphData.links.indexOf(l)].rot;
			}}
			linkVisibility={(l: LinkObject) => {
				if (attrs === undefined) return true;
				let ats = attrs[props.graphData.links.indexOf(l)]
				// console.log(ats);
				return isLinkVisible(l, ats.firstLink);// && (ats.fc !== undefined);
			}}
			linkOpacity={0.5}
			
		/>
	);
};
export default DynamicGraph;
