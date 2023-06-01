import type { NextPage } from 'next';

import { AdminLayout } from '@layout';

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

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

const Home: NextPage = () => (
	<AdminLayout>
		<div className='row'>
			<div className='col-sm-6 col-lg-3'>This is the home dash</div>
		</div>
	</AdminLayout>
);

export default Home;
