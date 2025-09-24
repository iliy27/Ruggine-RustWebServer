import { Routes, Route } from "react-router";
import AuthPage from "./Views/AuthPage.jsx";
import { useState } from "react";
import ChatsPage from "./Views/ChatsPage.jsx";
import DefaultLayout from "./Views/DefaultLayout.jsx";
import RequestsPage from "./Views/RequestsPage.jsx";
import { logoutUser } from "./API.js";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated") === "true");
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      window.location.href = "/";
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthPage
            onLoginSuccess={() => {
              setIsAuthenticated(true);
              localStorage.setItem("isAuthenticated", "true");
            }}
          />
        }
      />
      <Route
        path="/chats"
        element={
          isAuthenticated ? (
            <DefaultLayout onLogout={handleLogout}>
              <ChatsPage />
            </DefaultLayout>
          ) : (
            <AuthPage
              onLoginSuccess={() => {
                setIsAuthenticated(true);
                localStorage.setItem("isAuthenticated", "true");
              }}
            />
          )
        }
      />
      <Route
        path="/requests"
        element={
          isAuthenticated ? (
            <DefaultLayout onLogout={handleLogout}>
              <RequestsPage />
            </DefaultLayout>
          ) : (
            <AuthPage
              onLoginSuccess={() => {
                setIsAuthenticated(true);
                localStorage.setItem("isAuthenticated", "true");
              }}
            />
          )
        }
      />
    </Routes>
  );
}

export default App;
