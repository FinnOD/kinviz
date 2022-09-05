import { Select } from "antd";
const { Option } = Select;

const DropdownSelect = (props: {
	selectedName: string;
	dict: any;
	handleChange: any;
}) => {
	return (
		<Select
			defaultValue={props.selectedName}
			style={{ width: '100%' }}
			onChange={props.handleChange}
		>
			{Object.keys(props.dict).map((key, index) => (
				<Option key={key} value={key}>
					{key}
				</Option>
			))}
		</Select>
	);
};
export default DropdownSelect;