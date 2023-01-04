import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'
import '../components/i18n';
import React, { useEffect, useState } from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Link from "next/link";
import {useRouter} from 'next/router'

import { ResourceDescription, SearchResults } from '../types/HubTypes'

const inter = Inter({ subsets: ['latin'] });

export default function SearchPage() {

  const router = useRouter()
  const [ query, setQuery] = useState("");

  const getSearchResults = ( query:string, page:number ) => {
    return {
      "records": [
        {
          "id": "r6r7r86",
          "title": "Brain of the Firm"
        }
      ]
    }
  }

  const handleSubmit = (event:any) => {
    event.preventDefault();
    router.push({
      pathname: '/search',
      query: {q: query},
    })
  }

  const renderSearchResult = (result: ResourceDescription, index: number) => {
    return (
      <li key={index}>
        <Link className="nav-link" href={'/resourceDescription/'+result.id}>{result.title}</Link>
      </li>
    )
  }

  const handleChange = ( e:any, field:string ) => {
    setQuery(e.target.value);
  }

  return (
    <main className={styles.main}>
      <Row>
        <Col sm={12}>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Search:</Form.Label>
              <Form.Control onChange={e => handleChange(e,'selectedTenantName')}
                            value={query}
                            type="text"
                            name="tenantName"/>
            </Form.Group>
          </Form>

          <ul>
             {getSearchResults(query,0)?.records?.map(renderSearchResult)}
          </ul>
        </Col>
      </Row>
    </main>
  )
}
