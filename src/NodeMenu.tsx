import { Menu } from "antd";
import { NodeInput } from "./DynGraph";

export default function NodeMenu(props: {targetNode: NodeInput | null}){
    if(!props.targetNode) return <></>;

	return (
		<Menu>
			<Menu.ItemGroup title={props.targetNode.name}>
				<Menu.Item key="1">{props.targetNode.id}</Menu.Item>
				<Menu.Item key="2">{props.targetNode.type}</Menu.Item>
			</Menu.ItemGroup>
		</Menu>
	);
};
