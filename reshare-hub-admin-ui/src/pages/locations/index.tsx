import { GetServerSideProps, NextPage } from 'next'
import { Card } from 'react-bootstrap'
import { AdminLayout } from '@layout'
import React, { useEffect, useState } from 'react'
import { newResource, Resource } from '@models/resource'
import { Location } from '@models/Location'
import { transformResponseWrapper, useSWRAxios } from '@hooks'
import { Pagination } from '@components/Pagination'
import { useSession, signIn, signOut } from "next-auth/react"
import { LocationList } from '@components/Location'

type Props = {
  page: number;
  perPage: number;
  sort: string;
  order: string;
}

const Locations: NextPage<Props> = (props) => {
  const {
    page: initPage, perPage: initPerPage, sort: initSort, order: initOrder,
  } = props

  const [page, setPage] = useState(initPage)
  const [perPage, setPerPage] = useState(initPerPage)
  const [sort, setSort] = useState(initSort)
  const [order, setOrder] = useState(initOrder)
  const { data: session, status } : {data:any, status:any} =useSession();

  const agencyListURL = "https://dcb.libsdev.k-int.com/locations";

  const [fallbackResource, setFallbackResource] = useState<Resource<Location>>(
    newResource([], {from:0, to:0, size:20, last_page:0, current_page:0}, 0),
  )

  // swr: data -> axios: data -> resource: data
  const { data: { data: resource } } = useSWRAxios<Resource<Location>>({
    url: agencyListURL,
    params: {
      // _page: page,
      // _limit: perPage,
      // _sort: sort,
      // _order: order,
    },
    // transformResponse: transformResponseWrapper((d: PatronRequest[], h) => {
    transformResponse: transformResponseWrapper((d) => {
      // const total = h ? parseInt(h['x-total-count'], 10) : 0
      // return newResource(d, total, page, perPage)
      return newResource(d.content, d.pageable, d.totalSize);
    }),
  }, {
    data: fallbackResource,
    headers: {
      'x-total-count': '0',
    },
  })

  useEffect(() => {
    setFallbackResource(resource)
  }, [resource])


  // <Pagination meta={resource.pageable} setPerPage={setPerPage} setPage={setPage} />
  return (
    <AdminLayout>
      <Card>
        <Card.Header>Locations</Card.Header>
        <Card.Body>
          <Pagination meta={resource.meta} setPerPage={setPerPage} setPage={setPage} />
          <LocationList
            locations={resource.content}
            setSort={setSort}
            setOrder={setOrder}
          />

        </Card.Body>
      </Card>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  let page = 1
  if (context.query?.page && typeof context.query.page === 'string') {
    page = parseInt(context.query.page, 10)
  }

  let perPage = 20
  if (context.query?.per_page && typeof context.query.per_page === 'string') {
    perPage = parseInt(context.query.per_page.toString(), 10)
  }

  let sort = 'id'
  if (context.query?.sort && typeof context.query.sort === 'string') {
    sort = context.query.sort
  }

  let order = 'asc'
  if (context.query?.order && typeof context.query.order === 'string') {
    order = context.query.order
  }

  return {
    props: {
      page,
      perPage,
      sort,
      order,
    }, // will be passed to the page component as props
  }
}

export default Locations