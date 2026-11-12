import { useCallback, useRef, useState } from "react";

/**
 * Runs one async action at a time, and says when one is running. A ref as well as state: a
 * second click can land before the disabled render does.
 */
export function useSingleFlight() {
	const inFlight = useRef(false);
	const [running, setRunning] = useState(false);

	const run = useCallback(async (work: () => Promise<void>) => {
		if (inFlight.current) return;
		inFlight.current = true;
		setRunning(true);
		try {
			await work();
		} finally {
			inFlight.current = false;
			setRunning(false);
		}
	}, []);

	return { running, run };
}
