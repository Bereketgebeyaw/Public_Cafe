
import ReactDOM from "react-dom/client";
import App from "./App";
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';


// ✅ THIS LINE FIXES EVERYTHING
import "@mantine/core/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider>
    <Notifications position="top-right" zIndex={1000} />
    <App />
  </MantineProvider>
);