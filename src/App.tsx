import React, { useState } from "react";
import { GraphData } from "react-force-graph-3d";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch } from "antd";

import "./App.css";
import DynamicGraph from "./DynGraph";

const networkJSON = require("./data/networkKinasesSmall.json");
// const networkJSON = require("./data/example.json");

function App() {
	// Graph
	// eslint-disable-next-line
	const [data, setData] = useState<GraphData>(networkJSON);

	//Drawer
	const [visible, setVisible] = useState(false);
	const showDrawer = () => {
		setVisible(true);
	};
	const onClose = () => {
		setVisible(false);
	};

	// ----- Drawer Children ------

	// Curve amount
	const percentFormatter = (value: number | undefined) => `${value ?? ""}%`;

	const [curveAmount, setCurve] = useState(50);
	const onLinkCurveSlide = (val: number | undefined) => {
		if (val !== undefined) setCurve(val);
	};

	// Show self loops
	const [showSelfLoops, setShowSelfLoops] = useState(true);
	const onSelfLoopsChange = (checked: boolean) => {
		setShowSelfLoops(checked);
	};

	return (
		<div className="App">
			<header className="App-header"></header>
			<div className="main">
				<div className="btn">
					<Button
						type="primary"
						size="large"
						icon={<MenuOutlined />}
						onClick={showDrawer}
					/>
				</div>
				<div className="maingraph">
					<DynamicGraph
						graphData={data}
						showSelfLoops={showSelfLoops}
						curveAmount={curveAmount}
					/>
				</div>
			</div>
			<Drawer title="Basic Drawer" placement="right" onClose={onClose} visible={visible}>
				<p>Link Curvature</p>
				<Slider
					onChange={onLinkCurveSlide}
					defaultValue={curveAmount}
					tipFormatter={percentFormatter}
				/>
				<p>
					Show self-loops <Switch defaultChecked onChange={onSelfLoopsChange} />
				</p>
			</Drawer>
		</div>
	);
}

export default App;
