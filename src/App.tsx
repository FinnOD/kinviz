import React, { useState } from "react";
import { GraphData } from "react-force-graph-3d";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch, Select } from "antd";
//user
import "./App.css";
import DynamicGraph from "./DynGraph";
import networkKinasesSmall from "./data/networkKinasesSmall.json"
import networkKinasesOnly from "./data/networkKinasesOnly.json"
import network from "./data/network.json"
import example from "./data/example.json"
import example2 from "./data/example2.json"

const { Option } = Select;

const networks: Record<string, GraphData> = {
	"Kinase Subset": networkKinasesSmall,
	"All Kinases": networkKinasesOnly,
	"Full network": network,
	"Example 1": example,
	"Example 2": example2,
};

const NetworkSelect = (props: {
	selectedNetworkName: string;
	netDict: any;
	handleNetworkChange: any;
}) => {
	return (
		<Select
			defaultValue={props.selectedNetworkName}
			style={{ width: '100%' }}
			onChange={props.handleNetworkChange}
		>
			{Object.keys(props.netDict).map((key, index) => (
				<Option key={key} value={key}>
					{key}
				</Option>
			))}
		</Select>
	);
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

	return (
		<div className="App">
			<header className="App-header"></header>
			<div className="main">
				<div className="btn">
					<Button
						type="text"
						size="large"
            style={{ paddingLeft: '0.33em'}}
						icon={<MenuOutlined style ={{ fontSize: '200%', color: 'white'}}/>}
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
			<Drawer title="Network Options" placement="right" onClose={onClose} visible={visible}>
				<p>Link Curvature</p>
				<Slider
					onChange={onLinkCurveSlide}
					defaultValue={curveAmount}
					tipFormatter={percentFormatter}
				/>
				<br />
				<p>
					Show self-loops <Switch defaultChecked onChange={onSelfLoopsChange} style={{float: 'right'}}/>
				</p>

				<br />
				<NetworkSelect
					selectedNetworkName={selectedNetworkName}
					netDict={networks}
					handleNetworkChange={(e: any) => setData(networks[e])}
				></NetworkSelect>
			</Drawer>
		</div>
	);
}

export default App;
