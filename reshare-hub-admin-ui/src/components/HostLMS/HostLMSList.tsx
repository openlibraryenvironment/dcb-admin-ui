import { Dropdown, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { HostLMS } from '@models/HostLMS'
import { THSort } from '@components/TableSort'
import Image from 'next/image'

type Props = {
  hostlmss: HostLMS[];
} & Pick<Parameters<typeof THSort>[0], 'setSort' | 'setOrder'>

export default function HostLMSList(props: Props) {
  const { hostlmss, setSort, setOrder } = props

  return (
    <Table responsive bordered hover>
      <thead className="bg-light">
        <tr>
          <th>#</th>
          <th aria-label="Action" />
        </tr>
      </thead>
      <tbody>
        {hostlmss.map((hostlms) => (
          <tr key={hostlms.id}>
            <td>{hostlms.id}</td>
            <td>{hostlms.code}</td>
            <td>{hostlms.name}</td>
            <td>{hostlms.lmsClientClass}</td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
