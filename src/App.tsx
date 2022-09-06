import React, { useState, useEffect } from "react";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Slider, Switch, Divider } from "antd";
//user
import "./App.css";
import DynamicGraph, { GraphData } from "./DynGraph";
import DropdownSelect from "./DropdownSelect";
import DataUpload, { FCData } from "./UploadComponent";
import Searchbox from "./Searchbox";
//data
import networkKinasesTiny from "./data/base-networks/networkKinasesTiny.json";
import defaultColorScheme from "./data/color-schemes/default.json";
import monokaiColorScheme from "./data/color-schemes/monokai.json";
import defaultLightColorScheme from "./data/color-schemes/default light.json";
import colorfulColorScheme from "./data/color-schemes/colorful.json";
import { NodeObject } from "react-force-graph-3d";

// type ProteinType = "Unclassified" | "Transcription" | "Structural" | "Metabolic" | "Ser/Thr/Tyr Kinase" | "Tyr Kinase" | "Phosphatase" | "Adapter/scaffold" | "Cytosketetal"

export interface ColorScheme {
	background: string;
	nodes: {
		kinase: string;
		substrate: string;
		selected: string;
		byType: Record<string, string>;
	};
	links: {
		default: string;
		selected: string;
		FCup: string;
		FCdown: string;
	};
}

function imputeColorScheme(inScheme: ColorScheme): ColorScheme {
	Object.keys(inScheme.nodes.byType).forEach((proteinType) => {
		if (!inScheme.nodes.byType[proteinType]) {
			if (proteinType.includes("Kinase"))
				inScheme.nodes.byType[proteinType] = inScheme.nodes.kinase;
			else inScheme.nodes.byType[proteinType] = inScheme.nodes.substrate;
		}
	});

	return inScheme;
}

function App() {
	// Load 'Tiny Kinase Subset' then load all the others.
	const [networks, setNetworks] = useState<Record<string, GraphData>>({
		"Tiny Subset": networkKinasesTiny,
	});
	useEffect(() => {
		import("./data/base-networks/networkKinasesSmall.json").then((data: GraphData) => {
			setNetworks((prevNets) => {
				return { ...prevNets, "Small Subset": data };
			});
		});
		import("./data/base-networks/networkKinasesMedium.json").then((data: GraphData) => {
			setNetworks((prevNets) => {
				return { ...prevNets, "Medium Subset": data };
			});
		});
		import("./data/base-networks/networkKinasesOnly.json").then((data: GraphData) => {
			setNetworks((prevNets) => {
				return { ...prevNets, "All Kinases": data };
			});
		});
		// @ts-ignore network file is too large and linter throws an error
		import("./data/base-networks/network.json").then((data: GraphData) => {
			setNetworks((prevNets) => {
				return { ...prevNets, "Full network": data };
			});
		});
	}, []);

	const [colorSchemes, setColorSchemes] = useState<Record<string, ColorScheme>>({
		"Default": imputeColorScheme(defaultColorScheme),
		"Monokai": imputeColorScheme(monokaiColorScheme),
		"Default - Light": imputeColorScheme(defaultLightColorScheme),
		"Colourful": imputeColorScheme(colorfulColorScheme)
	});
	const [selectedColorScheme, setSelectedColorScheme] = useState(Object.keys(colorSchemes)[0]);
	const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemes[selectedColorScheme]);

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

	const [showSubstrates, setShowSubstrates] = useState(true);
	const onShowSubstratesChange = (checked: boolean) => {
		setShowSubstrates(checked);
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

	//Clicked node
	const [clickedNode, setClickedNode] = useState<NodeObject | null>(null);
	const [searchFocused, setSearchFocused] = useState(false);
	//Really sorry about this. Couldn't figure out how to clear searchbar on click out using useImpertiveHandle.
	const [clearBar, setClearBar] = useState(false);

	return (
		<div className="App">
			<div className="main">
				<div className="btn">
					<Button
						type="text"
						size="large"
						id="menubutton"
						icon={<MenuOutlined style={{ fontSize: "200%", color: "white" }} />}
						onClick={showDrawer}
					/>
					<Searchbox
						graphData={data}
						clickedNode={clickedNode}
						setClickedNode={setClickedNode}
						takeKeys={!visible}
						searchFocused={searchFocused}
						setSearchFocused={setSearchFocused}
						clearBar={clearBar}
						setClearBar={setClearBar}
					></Searchbox>
				</div>
				<div
					className={searchFocused ? "maingraph greyed" : "maingraph"}
					onClick={(e) => {
						setClearBar(true);
					}}
				>
					<DynamicGraph
						graphData={data}
						showSelfLoops={showSelfLoops}
						curveAmount={curveAmount}
						fcData={fcData}
						is3D={is3D}
						showSubstrates={showSubstrates}
						change3D={on3DChange}
						clickedNode={clickedNode}
						searchFocused={searchFocused}
						colorScheme={colorScheme}
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
				<DropdownSelect
					selectedName={selectedNetworkName}
					dict={networks}
					handleChange={(selectedVal: string) => {
						setSelectedNetworkName(selectedVal);
						setData(networks[selectedVal]);
					}}
				></DropdownSelect>
				<p />
				Display Dimension
				<Switch
					defaultChecked
					unCheckedChildren="2D"
					checkedChildren="3D"
					checked={is3D}
					onChange={on3DChange}
					style={{ float: "right" }}
				/>
				<p />
				Fold-Change Data
				<br />
				<DataUpload fcDataCallback={setFCData}></DataUpload>
				<br />
				Color Scheme
				<br />
				<DropdownSelect
					selectedName={selectedColorScheme}
					dict={colorSchemes}
					handleChange={(selectedVal: string) => {
						setSelectedNetworkName(selectedVal);
						setColorScheme(colorSchemes[selectedVal]);
					}}
				></DropdownSelect>
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
				<p>
					Show substrates
					<Switch
						defaultChecked
						onChange={onShowSubstratesChange}
						style={{ float: "right" }}
					/>
				</p>
			</Drawer>
		</div>
	);
}

export default App;
