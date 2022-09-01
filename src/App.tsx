import React, { useState, useEffect } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch, Divider } from "antd";
//user
import "./App.css";
import DynamicGraph, { GraphData } from "./DynGraph";
import NetworkSelect from "./NetworkSelect";
import DataUpload, { FCData } from "./UploadComponent";
//data
import networkKinasesTiny from "./data/networkKinasesTiny.json";

function App() {
	
	// Load 'Tiny Kinase Subset' then load all the others.
	const [networks, setNetworks] = useState<Record<string, GraphData>>({"Tiny Kinase Subset": networkKinasesTiny})
	useEffect(() => {	
		(new Promise(r => setTimeout(r, 10000))).then(() => {console.log('done sleep')});
		import("./data/networkKinasesSmall.json").then((data: GraphData) => {
			setNetworks((prevNets) => {return {...prevNets, "Small Kinase Subset": data};})
		});
		import("./data/networkKinasesMedium.json").then((data: GraphData) => {
			setNetworks((prevNets) => {return {...prevNets, "Medium Kinase Subset": data};})
		});
		import("./data/networkKinasesOnly.json").then((data: GraphData) => {
			setNetworks((prevNets) => {return { ...prevNets, "All Kinases": data};})
		});
		// @ts-ignore network file is too large and linter throws an error
		import("./data/network.json").then((data: GraphData) => {
			setNetworks((prevNets) => {return {...prevNets, "Full network": data};})
			console.log('net')
		});

	}, []);

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

				<DynamicGraph
					graphData={data}
					showSelfLoops={showSelfLoops}
					curveAmount={curveAmount}
					fcData={fcData}
					is3D={is3D}
					change3D={on3DChange}
				/>
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
