import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "../plataforma_ensenanza_premium_opengrowth (1).jsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={300}>
      <SidebarProvider className="contents">
        <App />
      </SidebarProvider>
    </TooltipProvider>
  </React.StrictMode>
);
