import Link from "@components/Link/Link";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
interface LocationProps {
	latitude: number;
	longitude: number;
}
// 	href="https://www.google.com/maps/search/?api=1&query=38.9453%2C92.3288"
export default function Location({ latitude, longitude }: LocationProps) {
	// if needed, set precision here
	const mapsURL =
		"https://www.google.com/maps/search/?api=1&query=" +
		latitude +
		"%2C" +
		longitude;
	// ACCESSIBILITY: Signal a new tab is being opened
	return (
		<Link
			href={mapsURL}
			title={
				"Google Maps URL for the location specified. This will open in a new tab."
			}
			target="_blank"
			rel="noreferrer"
		>
			<RenderAttribute attribute={latitude + ", " + longitude} />
		</Link>
	);
}
