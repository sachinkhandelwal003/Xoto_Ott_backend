import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import {
  setAuthTokenGetter,
  setBaseUrl,
} from "./lib/api-client";

setBaseUrl("http://localhost:3000");

setAuthTokenGetter(() =>
  localStorage.getItem("accessToken")
);

createRoot(document.getElementById("root")!).render(
  <App />
);