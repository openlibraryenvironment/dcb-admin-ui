import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../../styles/Home.module.css'
import '../../components/i18n';
import React, { useEffect, useState } from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Link from "next/link";
import {useRouter} from 'next/router'


import { ResourceDescription, SearchResults } from '../../types/HubTypes'

const inter = Inter({ subsets: ['latin'] });

export default function ResourceDescriptionPage() {

  const router = useRouter()

  return (
    <main className={styles.main}>
      <Row>
        <Col sm={12}>
          An information resources
          <Button>Request</Button>
 
        </Col>
      </Row>
    </main>
  )
}
