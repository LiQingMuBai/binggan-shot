import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import SunStrikePage from "@/pages/SunStrikePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SunStrikePage />} />
      </Routes>
    </Router>
  );
}
