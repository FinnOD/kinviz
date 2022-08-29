import { Menu } from "antd";
import type { MenuProps } from "antd";
import { NodeInput } from "./DynGraph";

export default function NodeMenu(props: {
	targetNode: NodeInput | null;
	selfSetVisible: (visible: boolean) => void;
    setSubgraphNode: React.Dispatch<React.SetStateAction<NodeInput | null>>;
}) {
	if (!props.targetNode) return <></>;

	const handleMenuClick: MenuProps["onClick"] = (e) => {
		props.selfSetVisible(false);
        props.setSubgraphNode(props.targetNode)
	};

	return (
		<Menu onClick={handleMenuClick} selectedKeys={["0"]}>
			<Menu.ItemGroup title={props.targetNode.name}>
				<Menu.Item key="1">Show neighbours</Menu.Item>
				{/* <Menu.Item key="2">{props.targetNode.type}</Menu.Item> */}
			</Menu.ItemGroup>
		</Menu>
	);
}
