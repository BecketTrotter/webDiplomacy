import * as React from "react";
import "./assets/css/App.css";
import Box from "@mui/material/Box";
import map from "./assets/svg/map.svg";
import WDActionIcon from "./components/WDActionIcon";
import WDHomeIcon from "./components/WDHomeIcon";

const App: React.FC = function (): React.ReactElement {
  return (
    <Box className="App">
      <img alt="Game Map" src={map} />
    </Box>
  );
};

export default App;
