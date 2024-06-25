import Head from 'next/head'
import Layout from '@/components/Layout'
import Employers from '@/components/Employers'

export default function About() {
  return (
    <Layout>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>For Employers | Prophet.</title>
      </Head>
      <Employers />
    </Layout>
  )
}
