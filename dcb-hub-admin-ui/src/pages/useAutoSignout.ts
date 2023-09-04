/*
TO USE....
1. Import SignOutIfInactive
2. Call it before the return statement
 2.1. If other hooks are being used, only call it after those (https://bobbyhadz.com/blog/react-rendered-more-hooks-than-during-previous-render)
*/

//Idle timer hook by: https://idletimer.dev/
import { useIdleTimer } from 'react-idle-timer';
import { signOut } from 'next-auth/react';

export default function SignOutIfInactive() {
	//signs the user out if idle for timeout amount of milliseconds
	const onIdle: any = () => {
		signOut();
		alert('You have been logged out due to inactivity');
	};

	const { getRemainingTime } = useIdleTimer({
		onIdle,
		timeout: 900_000,
		throttle: 500
	});
}
