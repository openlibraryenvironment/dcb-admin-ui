import { Dropdown, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { PatronRequest } from '@models/PatronRequest'
import { THSort } from '@components/TableSort'
import Image from 'next/image'

type Props = {
  patronRequests: PatronRequest[];
} & Pick<Parameters<typeof THSort>[0], 'setSort' | 'setOrder'>

export default function PatronRequestList(props: Props) {
  const { patronRequests, setSort, setOrder } = props

  return (
    <Table responsive bordered hover>
      <thead className="bg-light">
        <tr>
          <th>#</th>
          <th><THSort name="patronId" setSort={setSort} setOrder={setOrder}>Patron Id</THSort></th>
          <th><THSort name="patronAgency" setSort={setSort} setOrder={setOrder}>Patron Agency</THSort></th>
          <th>Bib Cluster</th>
          <th><THSort name="pickupLocation" setSort={setSort} setOrder={setOrder}>Pickup Location</THSort></th>
          <th><THSort name="statusCode" setSort={setSort} setOrder={setOrder}>Status Code</THSort></th>
          <th aria-label="Action" />
        </tr>
      </thead>
      <tbody>
        {patronRequests.map((patronRequest) => (
          <tr key={patronRequest.id}>
            <td>{patronRequest.id}</td>
            <td>{patronRequest.patronId}</td>
            <td>{patronRequest.patronAgencyCode}</td>
            <td>{patronRequest.bibClusterId}</td>
            <td>{patronRequest.pickupLocationCode}</td>
            <td>{patronRequest.statusCode}</td>
            <td>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
