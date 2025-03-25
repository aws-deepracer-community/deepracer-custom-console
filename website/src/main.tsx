import React from "react";
import ReactDOM from "react-dom/client";
import { StorageHelper } from "./common/helpers/storage-helper";
import App from "./app";
import "@cloudscape-design/global-styles/index.css";
import axios from "axios";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const theme = StorageHelper.getTheme();
StorageHelper.applyTheme(theme);

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
  axios.defaults.headers.common = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': csrfToken
  };
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);