import LinearProgress, {
	LinearProgressProps,
	linearProgressClasses,
} from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { MdFilePresent, MdClose } from "react-icons/md";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";

// material ui code reference for progress bar: https://mui.com/material-ui/react-progress/#linear-with-label
function LinearProgressWithLabel(
	props: LinearProgressProps & { value: number },
) {
	return (
		<Box sx={{ display: "flex", alignItems: "center" }}>
			<Box sx={{ width: "100%", mr: 1 }}>
				<LinearProgress variant="determinate" {...props} />
			</Box>
			<Box sx={{ minWidth: 35 }}>
				<Typography variant="body2" color="text.secondary">{`${Math.round(
					props.value,
				)}%`}</Typography>
			</Box>
		</Box>
	);
}

const BorderLinearProgress = styled(LinearProgressWithLabel)(({ theme }) => ({
	height: 10,
	borderRadius: 5,
	[`&.${linearProgressClasses.colorPrimary}`]: {
		backgroundColor:
			theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
	},
	[`& .${linearProgressClasses.bar}`]: {
		borderRadius: 5,
		backgroundColor: theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
	},
}));

const RenderFileUploadStatus = (props: any) => {
	const [progress, setProgress] = useState(10);

	useEffect(() => {
		//this is to just to show how the progress bar looks loading, remove to retain actual functionality
		const timer = setInterval(() => {
			setProgress((prevProgress) =>
				prevProgress >= 100 ? 10 : prevProgress + 10,
			);
		}, 800);
		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<Box
			sx={{
				width: "100%",
				border: 2,
				borderColor: "lightgray",
				borderRadius: 3,
				padding: 1,
				display: "flex",
				maxWidth: "45%",
				minWidth: 300,
			}}
		>
			<MdFilePresent size={25} style={{ marginRight: 2, minWidth: 25 }} />
			<Box sx={{ mx: "auto", width: "85%" }}>
				<Typography
					sx={{
						fontSize: 15,
						fontWeight: "bold",
						wordWrap: "break-word",
						width: "100%",
					}}
				>
					CirculationStatusMapping.csv
				</Typography>
				<Typography
					sx={{ fontSize: 13, wordWrap: "break-word", width: "100%" }}
				>
					15KB
				</Typography>
				<BorderLinearProgress
					variant="determinate"
					value={progress}
					aria-label="file-upload-progress-bar"
				/>
			</Box>
			<Box
				sx={{ display: "flex", alignItems: "center", wordWrap: "break-word" }}
			>
				<IconButton
					aria-label="close-file-upload-component"
					onClick={props.hideComponent}
				>
					<MdClose />
				</IconButton>
			</Box>
		</Box>
	);
};

/* logic regarding when the file upload component will show needs to be handled seperately 
   as part of the actual file upload implementation  */
export default function FileUploadStatus() {
	const [hidden, setHidden] = useState(false);

	const HandleComponentToggle = () => {
		setHidden(!hidden);
	};

	return (
		<>
			<button onClick={() => HandleComponentToggle()}>Toggle Component</button>
			{/* to hide the component when 'x' button is clicked */}
			{hidden == true ? null : (
				<RenderFileUploadStatus hideComponent={() => HandleComponentToggle()} />
			)}
		</>
	);
}
