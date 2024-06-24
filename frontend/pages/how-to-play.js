import Head from 'next/head';
import Layout from '@/components/Layout';
import Rules from '@/components/Rules';

export default function HowToPlay() {
  return (
    <Layout>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>How To Play | Prophet.</title>
      </Head>
      <Rules />
    </Layout>
  );
}
