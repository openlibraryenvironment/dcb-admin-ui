import { Dropdown, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { Location } from '@models/Location'
import { THSort } from '@components/TableSort'
import Image from 'next/image'

type Props = {
  locations: Location[];
} & Pick<Parameters<typeof THSort>[0], 'setSort' | 'setOrder'>

export default function LocationList(props: Props) {
  const { locations, setSort, setOrder } = props

  return (
    <Table responsive bordered hover>
      <thead className="bg-light">
        <tr>
          <th>#</th>
          <th><THSort name="locationCode" setSort={setSort} setOrder={setOrder}>Code</THSort></th>
          <th><THSort name="locationName" setSort={setSort} setOrder={setOrder}>Name</THSort></th>
          <th aria-label="Action" />
        </tr>
      </thead>
      <tbody>
        {locations.map((location) => (
          <tr key={location.id}>
            <td>{location.id}</td>
            <td>{location.code}</td>
            <td>{location.name}</td>
            <td>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
