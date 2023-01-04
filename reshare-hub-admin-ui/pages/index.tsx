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

const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  const [ query, setQuery] = useState("");
  const router = useRouter()

  const handleChange = ( e:any, field:string ) => {
    // setSearchState((prev:any) => ({...prev, [field]: e.target.value}));
    setQuery(e.target.value);
  }

  const handleSubmit = (event:any) => {
    event.preventDefault();
    router.push({
      pathname: '/search',
      query: {q: query},
    })
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
        </Col>
      </Row>
    </main>
  )
}
