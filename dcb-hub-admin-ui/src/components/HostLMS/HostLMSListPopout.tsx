import * as React from 'react';

import { HostLMS } from '@models/HostLMS';

import { Offcanvas } from 'react-bootstrap';

const HostLMSListPopout = ({
	show,
	onClick,
	content
}: {
	show: boolean;
	onClick: Function;
	content: HostLMS | null;
}) => {
	// When there is no content to parse don't return the popout
	if (content === null) return null;

	return (
		<Offcanvas show={show} onHide={onClick} placement='end'>
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>{content.name}</Offcanvas.Title>
			</Offcanvas.Header>
			<Offcanvas.Body>
				{Object.entries(content).map(([key, value]) => {
					if (key === 'clientConfig') return null;

					return (
						<p style={{ wordWrap: 'break-word' }} key={key}>
							<span className='fw-bold text-capitalize me-1'>{key}</span>:
							<span className='ms-1'>{value}</span>
						</p>
					);
				})}
			</Offcanvas.Body>
		</Offcanvas>
	);
};

export default HostLMSListPopout;
