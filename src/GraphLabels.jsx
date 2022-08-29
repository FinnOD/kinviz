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