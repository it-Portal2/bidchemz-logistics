import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '@/contexts/AuthContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=1200, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}

export default MyApp
