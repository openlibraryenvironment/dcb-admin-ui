import type { NextPage } from 'next';

import { AdminLayout } from '@layout';

import SignOutIfInactive from './useAutoSignout';

import {
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip
} from 'chart.js';

const Home: NextPage = () => {
	SignOutIfInactive();

	Chart.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Tooltip,
		Filler
	);

	return (
		<AdminLayout>
			<div className='row'>
				<div className='col-sm-6 col-lg-3'>This is the home dash</div>
			</div>
		</AdminLayout>
	);
};

export default Home;
