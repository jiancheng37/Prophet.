import Head from 'next/head'
import PredictionForm from '@/components/PredictionForm'
import Layout from '@/components/Layout'

export default function Play() {
  return (
    <Layout>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>Play | Prophet.</title>
      </Head>
      <PredictionForm />
    </Layout>
  )
}
