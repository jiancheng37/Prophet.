import Head from 'next/head';
import Layout from '@/components/Layout';

export default function About() {
  return (
    <>
      <Layout>
        <Head>
          <link rel="icon" href="/favicon.png" type="image/png" />
          <title>About | Prophet.</title>
        </Head>
      </Layout>
    </>
  );
}
