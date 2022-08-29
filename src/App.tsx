import React, { useState } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch, Divider } from "antd";
//user
import "./App.css";
import DynamicGraph, { GraphData } from "./DynGraph";
import NetworkSelect from "./NetworkSelect";
import DataUpload, { FCData } from "./UploadComponent";
//data
import networkKinasesTiny from "./data/networkKinasesTiny.json";
import networkKinasesSmall from "./data/networkKinasesSmall.json";
import networkKinasesMedium from "./data/networkKinasesMedium.json";
import networkKinasesOnly from "./data/networkKinasesOnly.json";
import network from "./data/network.json";



const networks: Record<string, GraphData> = {
	"Tiny Kinase Subset": networkKinasesTiny,
	"Small Kinase Subset": networkKinasesSmall,
	"Medium Kinase Subset": networkKinasesMedium,
	"All Kinases": networkKinasesOnly,
	// @ts-ignore network file is too large and compiler throws an error
	"Full network": network,
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

	const [is3D, setIs3D] = useState(true);
	const on3DChange = (checked: boolean) => {
		setIs3D(checked);
	};

	// Network select
	// Use the first network in the dict.
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
						is3D={is3D}
						change3D={on3DChange}
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
				Display Dimension
				<Switch
						defaultChecked
						checkedChildren="3D"
						unCheckedChildren="2D" 
						checked={is3D}
						onChange={on3DChange}
						style={{ float: "right" }}
					/>
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
