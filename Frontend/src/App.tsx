import Donate from "./components/Donate";
import Withdraw from "./pages/Withdraw";
import SignerPanel from "./pages/SignerPanel";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Donate />} />

        {/* ✅ Withdraw page */}
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/signer" element={<SignerPanel />} />

        {/* ✅ Redirect unknown routes */}
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;