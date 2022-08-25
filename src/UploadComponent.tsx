import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, message, Upload } from "antd";

const propsBaked: UploadProps = {
	name: "file",
	action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
	headers: {
		authorization: "authorization-text",
	},
	maxCount: 1,
	onChange(info) {
		if (info.file.status !== "uploading") {
			// console.log(info.file, info.fileList);
		}
		if (info.file.status === "done") {
			message.success(`${info.file.name} file uploaded successfully`);
		} else if (info.file.status === "error") {
			message.error(`${info.file.name} file upload failed.`);
		}
	},
};

export type FCEntry = {
	targetid: string;
	site: string;
	fc: number;
	err: number;
}
export type FCData = Array<FCEntry>;

const DataUpload = (props: { fcDataCallback: (fcData: FCData | undefined) => void }) => (
	<Upload
		{...propsBaked}
		beforeUpload={(file) => {
			let reader = new FileReader();
			reader.onload = function (event: any) {
				// The file's text will be printed here

				let dataObj: FCData = JSON.parse(event.target.result);
				props.fcDataCallback(dataObj);
				console.log("got uploaded data ", typeof dataObj);
			};

			reader.readAsText(file);
			return false;
		}}
		onRemove={(file) => {
			props.fcDataCallback(undefined);
		}}
	>
		<Button icon={<UploadOutlined />}>Click to Upload</Button>
	</Upload>
);

export default DataUpload;
