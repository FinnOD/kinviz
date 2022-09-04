import { useRef, useEffect, useState, MutableRefObject } from "react";
import { NodeObject } from "react-force-graph-3d";
import { GraphData } from "./DynGraph";


const useFocus = (): [any, (foc: boolean) => void] => {
	const htmlElRef: MutableRefObject<any> = useRef(null);
	const setFocus = (foc: boolean): void => {
		if (foc) htmlElRef?.current?.focus?.();
		else htmlElRef?.current?.blur?.();
	};

	return [htmlElRef, setFocus];
};

function searchGNames(graphData: GraphData, term: string) {
	if (!term) return [];

	let rough = graphData.nodes.filter((element) =>
		element.name.toLowerCase().includes(term.toLowerCase())
	);

	return rough.sort((a, b) => (a.name === b.name ? 0 : a.name > b.name ? 1 : -1));
}

function Searchbox(props: {
	graphData: GraphData;
	clickedNode: NodeObject | null;
	setClickedNode: React.Dispatch<React.SetStateAction<NodeObject | null>>;
	takeKeys: boolean;
	searchFocused: boolean;
	setSearchFocused: React.Dispatch<React.SetStateAction<boolean>>;
	clearBar: boolean
	setClearBar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [typedEver, setTypedEver] = useState<boolean>(false);
	const [selectPosition, setSelectPosition] = useState<number>(0);

	const [inputRef, setInputFocus] = useFocus();
	function downHandler(ev: KeyboardEvent) {
		if (!props.takeKeys) return;
		
		if (ev.key === "ArrowDown") {
			ev.preventDefault();
			setSelectPosition(Math.min(selectPosition + 1, searchedNodes.length));
		}
		if (ev.key === "ArrowUp") {
			ev.preventDefault();
			setSelectPosition(Math.max(selectPosition - 1, 1));
		}
		if (ev.key === "Backspace") {
			if (text.length === 1) {
				setText("");
				setInputFocus(false);
			} else if(text.length > 1){
				if(!typedEver)
					setText("");
				setInputFocus(true);
			}
		}
		if (ev.key === "Escape") {
			setText("");
			setInputFocus(false);
		}
		if (ev.key === "Enter") {
			if (searchedNodes.length === 1) props.setClickedNode(searchedNodes[0]);

			props.setClickedNode(searchedNodes[selectPosition - 1]);
			setText("");
			setInputFocus(false);
		}

		setTypedEver(true);
	}

	function pressHandler(ev: KeyboardEvent) {
		if (!props.takeKeys) return;
		setTypedEver(true);

		if (!props.searchFocused) {
			setText("");
			props.setSearchFocused(true);
			setInputFocus(true);
		}
	}

	useEffect(() => {
		window.addEventListener("keypress", pressHandler);
		window.addEventListener("keydown", downHandler);

		return () => {
			window.removeEventListener("keypress", pressHandler);
			window.removeEventListener("keydown", downHandler);
		};
	});

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setText(e.target.value.toLocaleUpperCase());
	};

	const initString = "Node search...";
	const [text, setText] = useState<string>(initString);
	useEffect(() => {
		if (text) {
			let nodes = searchGNames(props.graphData, text);
			setSearchedNodes(nodes);
		} else {
			setSearchedNodes([]);
			setSelectPosition(0);
		}
	}, [text, props.graphData, typedEver]);

	useEffect(() => {
		if(typedEver && props.clearBar){
			setText("");
			props.setClearBar(false);
		}
	}, [props.clearBar]);

	const [searchedNodes, setSearchedNodes] = useState<Array<NodeObject>>([]);
	const listItems = searchedNodes.slice(0, 10).map((node: any, i) => {
		let selectedNode = props.clickedNode?.id === node.id;
		let classname =
			"searchItem" +
			(i + 1 === selectPosition ? " selectedItem" : "") +
			(selectedNode ? " clickedNodeItem" : "");

		return (
			<li
				key={node.id}
				onMouseEnter={() => setSelectPosition(i + 1)}
				onClick={() => {
					console.log("made");
					props.setClickedNode(node);
					setText("");
					setInputFocus(false);
				}}
				className={classname}
			>
				{node.name}
			</li>
		);
	});

	return (
		<div id="search">
			<input
				id="searchinput"
				type="text"
				autoComplete="off"
				ref={inputRef}
				onClick={() => {
					if (!typedEver) {
						setTypedEver(true);
						setText("");
					}
				}}
				onBlur={() => {
					props.setSearchFocused(false);
					setInputFocus(false);
				}}
				onFocus={() => props.setSearchFocused(true)}
				value={text}
				className={
					!typedEver
						? "neverTyped"
						: props.searchFocused || searchedNodes.length > 0
						? "focused"
						: ""
				}
				onChange={handleInput}
			></input>
			<ul id="searchResults" onMouseOut={() => setSelectPosition(0)}>{listItems}</ul>
		</div>
	);
}

export default Searchbox;
