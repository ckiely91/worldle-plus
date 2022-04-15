import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleLeft, faChartLine } from "@fortawesome/free-solid-svg-icons";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Worldle+</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex justify-center flex-auto dark:bg-slate-900 dark:text-slate-50">
        <div className="w-full max-w-lg flex flex-col">
          <header className="flex justify-between items-center px-3 border-b-2 border-gray-200">
            <div className="w-5">
              {router.pathname !== "/" && (
                <Link href="/">
                  <a>
                    <FontAwesomeIcon
                      icon={faCircleLeft}
                      className="w-5 cursor-pointer"
                    />
                  </a>
                </Link>
              )}
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-wide text-center my-1 flex-auto">
              Worldle+
            </h1>
            <div className="w-5">
              {router.pathname !== "/stats" && (
                <Link href="/stats">
                  <a>
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="w-5 cursor-pointer"
                    />
                  </a>
                </Link>
              )}
            </div>
          </header>
          <div className="flex flex-grow flex-col relative">
            <Component {...pageProps} />
          </div>
        </div>
      </div>
    </>
  );
}

export default MyApp;
