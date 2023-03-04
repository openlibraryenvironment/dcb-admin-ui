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
          <th><THSort name="id" setSort={setSort} setOrder={setOrder}>#</THSort></th>
          <th aria-label="Action" />
        </tr>
      </thead>
      <tbody>
        {patronRequests.map((patronRequest) => (
          <tr key={patronRequest.id}>
            <td>{patronRequest.id}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
