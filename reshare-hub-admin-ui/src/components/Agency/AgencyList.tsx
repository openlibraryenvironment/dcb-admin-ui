import { Dropdown, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { Agency } from '@models/Agency'
import { THSort } from '@components/TableSort'
import Image from 'next/image'

type Props = {
  agencies: Agency[];
} & Pick<Parameters<typeof THSort>[0], 'setSort' | 'setOrder'>

export default function AgencyList(props: Props) {
  const { agencies, setSort, setOrder } = props

  return (
    <Table responsive bordered hover>
      <thead className="bg-light">
        <tr>
          <th>#</th>
          <th><THSort name="agencyId" setSort={setSort} setOrder={setOrder}>Code</THSort></th>
          <th><THSort name="agencyCode" setSort={setSort} setOrder={setOrder}>Name</THSort></th>
          <th aria-label="Action" />
        </tr>
      </thead>
      <tbody>
        {agencies.map((agency) => (
          <tr key={agency.id}>
            <td>{agency.id}</td>
            <td>{agency.code}</td>
            <td>{agency.name}</td>
            <td>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
