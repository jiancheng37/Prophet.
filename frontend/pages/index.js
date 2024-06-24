import Head from 'next/head';
import Layout from '@/components/Layout';
import HomeContent from '@/components/HomeContent';

export default function Home() {
  return (
    <Layout>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>Home | Prophet.</title>
      </Head>
      <HomeContent />
    </Layout>
  );
}
