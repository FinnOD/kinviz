import React, { useState } from "react";
// import { GraphData } from "react-force-graph-3d";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch, Divider } from "antd";
//user
import "./App.css";
import DynamicGraph, { GraphData } from "./DynGraphGraphology";
import NetworkSelect from "./NetworkSelect";
import DataUpload, { FCData } from "./UploadComponent";
//data
import networkKinasesSmall from "./data/networkKinasesSmall.json";
import networkKinasesMedium from "./data/networkKinasesMedium.json";
import networkKinasesOnly from "./data/networkKinasesOnly.json";
import network from "./data/network.json";
// import example from "./data/example.json";
import example2 from "./data/example2.json";



const networks: Record<string, GraphData> = {
	"Example 2": example2,
	"Small Kinase Subset": networkKinasesSmall,
	"Medium Kinase Subset": networkKinasesMedium,
	"All Kinases": networkKinasesOnly,
	// @ts-ignore network file is too large and compiler throws an error
	"Full network": network,
	// "Example 1": example,
	
};

function App() {
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

	// Network select
	// Use the first network in the dict.
	// eslint-disable-next-line
	const [selectedNetworkName, setSelectedNetworkName] = useState(Object.keys(networks)[0]);

	// Graph
	const [data, setData] = useState<GraphData>(networks[selectedNetworkName]);
	const [fcData, setFCData] = useState<FCData | undefined>(undefined);

	return (
		<div className="App">
			<header className="App-header"></header>
			<div className="main">
				<div className="btn">
					<Button
						type="text"
						size="large"
						style={{ paddingLeft: "0.33em" }}
						icon={<MenuOutlined style={{ fontSize: "200%", color: "white" }} />}
						onClick={showDrawer}
					/>
				</div>
				<div className="maingraph">
					<DynamicGraph
						graphData={data}
						showSelfLoops={showSelfLoops}
						curveAmount={curveAmount}
						fcData={fcData}
					/>
				</div>
			</div>
			<Drawer
				title="Network Options"
				placement="right"
				width={"30%"}
				onClose={onClose}
				visible={visible}
			>
				Base Dataset
				<br />
				<NetworkSelect
					selectedNetworkName={selectedNetworkName}
					netDict={networks}
					handleNetworkChange={(selectedVal: string) => {
						setSelectedNetworkName(selectedVal);
						setData(networks[selectedVal]);
					}}
				></NetworkSelect>
				<p />
				Fold-Change Data
				<br />
				<DataUpload fcDataCallback={setFCData}></DataUpload>
				<Divider />
				{/* </Divider> */}
				Link Curvature
				<Slider
					onChange={onLinkCurveSlide}
					defaultValue={curveAmount}
					tipFormatter={percentFormatter}
				/>
				<p>
					Show self-loops
					<Switch
						defaultChecked
						onChange={onSelfLoopsChange}
						style={{ float: "right" }}
					/>
				</p>
			</Drawer>
		</div>
	);
}

export default App;
