import { Select } from "antd";
const { Option } = Select;

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
export default NetworkSelect;