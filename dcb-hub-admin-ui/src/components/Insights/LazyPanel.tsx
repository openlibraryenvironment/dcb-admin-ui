import { useEffect, useRef, useState, ReactNode } from "react";
import { Skeleton } from "@mui/material";

// Renders a same-height placeholder until it scrolls near the viewport, then mounts its
// child (which is what triggers that panel's data fetch). This keeps the initial load to
// the combined KPI call + the trend chart; the ~15 below-the-fold panels only hit the API
// once the admin scrolls to them. rootMargin starts the fetch slightly ahead of view so
// there's no visible pop-in.
export default function LazyPanel({
	children,
	minHeight = 360,
}: {
	children: ReactNode;
	minHeight?: number;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (visible) return;
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "250px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [visible]);

	return (
		<div ref={ref}>
			{visible ? children : <Skeleton variant="rounded" height={minHeight} />}
		</div>
	);
}
