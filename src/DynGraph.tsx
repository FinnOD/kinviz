import ReactDOM from "react-dom";
import ForceGraph3D, { GraphData, LinkObject, NodeObject } from "react-force-graph-3d";
import { useWindowSize } from "usehooks-ts";
import * as ReactDOMServer from "react-dom/server";

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
function linkIDUnsorted(link: LinkObject): string {
	var tup = coerceLink(link);
	return "".concat(tup[0], "_", tup[1]);
}

type CurveRot = { rot: number; curve: number };
function getCurveAndRotation(link: LinkObject, i: number, allLinks: Array<string>): CurveRot {
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
		// if self loop?
		curve = 1;
		// rot = Math.PI/2;//(Math.sin(i) * 43758.5453123 % 1);
		// rot = 1.5;
	}

	return { rot: rot, curve: curve };
}

const NodeLabel = (props: { node: any }) => {

	return (
		<div className="nodeLabel">
			<b>{props.node.name}</b>
            <p/>
            {props.node.id}: {props.node.desc}.
		</div>
	);
};

const LinkLabel = (props: { link: any, nodeList: Array<NodeObject> }) => {

    // let [source, target]: any = LinkToNodes(props.link, props.nodeList);
    // console.log
	return (
		<div className="linkLabel">
			<b>{props.link.source.name}⟶{props.link.target.name}</b><p/>
            <b>Site: {props.link.substratePhosphosite} {props.link.effectCode !== "" && <>Effect: {props.link.effectCode}</>}</b><p/>
            {props.link.fullPhosphorylationEffect}.
		</div>
	);
};

const DynamicGraph = (props: {
	graphData: GraphData;
	showSelfLoops: boolean;
	curveAmount: number;
}) => {
	const allLinksDirectional = props.graphData.links.map((l) => linkIDUnsorted(l));
	const allLinks = props.graphData.links.map((l) => linkID(l));

	const isLinkVisible = (link: LinkObject) => {
		let canVis = link.source !== link.target || props.showSelfLoops;

		if (props.curveAmount > 0) return canVis;

		let numBefore = allLinksDirectional
			.slice(0, props.graphData.links.indexOf(link))
			.filter((x: string) => x === linkIDUnsorted(link)).length;

		return (numBefore === 0 || link.source === link.target) && canVis; //(numMatches === 1) ||;
	};

	const { width, height } = useWindowSize();
	var div = document.createElement("div");
	return (
		<ForceGraph3D
			//Basic Props
			graphData={props.graphData}
			width={width}
			height={height}
			nodeLabel={(n: any) => ReactDOMServer.renderToString(<NodeLabel node={n} />)}
			//Link props
            linkLabel={(l: any) => ReactDOMServer.renderToString(<LinkLabel link={l} nodeList={props.graphData.nodes} />)}
			linkDirectionalArrowLength={3.5}
			linkDirectionalArrowRelPos={1}
			linkCurvature={(l: LinkObject) => {
				let c = getCurveAndRotation(l, props.graphData.links.indexOf(l), allLinks).curve;
				c = Math.max((c * props.curveAmount) / 100, l.source !== l.target ? 0 : 0.2);
				return c;
			}}
			linkCurveRotation={(l: LinkObject) =>
				getCurveAndRotation(l, props.graphData.links.indexOf(l), allLinks).rot
			}
			linkVisibility={(l: LinkObject) => isLinkVisible(l)}
		/>
	);
};
export default DynamicGraph;
