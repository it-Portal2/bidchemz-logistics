import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=1200, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <ConfirmProvider>
          <Toaster position="top-center" />
          <Component {...pageProps} />
        </ConfirmProvider>
      </AuthProvider>
    </>
  )
}

export default MyApp
