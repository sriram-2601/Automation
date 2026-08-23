import { useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <Component {...pageProps} />;
}
