import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { useLocation } from "react-router";
import { useState, useEffect } from "react";
import { getUserRequests } from "../API";
import logo from "../assets/logo.png";

export default function DefaultLayout({ onLogout, children }) {
  const [pendingRequests, setPendingRequests] = useState(0);
  const location = useLocation();
  const isRequestsPage = location.pathname === '/requests';

  useEffect(() => {
    let interval;
    const fetchRequests = async () => {
      try {
        const reqs = await getUserRequests();
        setPendingRequests(Array.isArray(reqs) ? reqs.length : 0);
      } catch {
        setPendingRequests(0);
      }
    };
    fetchRequests();
    interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar
        bg="primary"
        variant="dark"
        fixed="top"
        expand="lg"
        className="px-4"
      >
        <Container fluid>
          <Navbar.Brand href="/chats">
            <img
              src={logo}
              alt="Logo"
              style={{ height: "40px", marginRight: "10px" }}
            />
            Ruggine
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="me-auto" />
            <Nav className="align-items-center">
              {isRequestsPage ? (
                <Button variant="outline-light" href="/chats" className="me-2">
                  Chats
                </Button>
              ) : (
                <Button variant="outline-light" href="/requests" className="me-2 position-relative">
                  Requests
                  {pendingRequests > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        background: "#25d366",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: "bold",
                        boxShadow: "0 0 2px #888",
                        zIndex: 2,
                      }}
                    >
                      {pendingRequests}
                    </span>
                  )}
                </Button>
              )}
              <Button variant="outline-light" onClick={onLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div style={{ paddingTop: "70px" }}>{children}</div>
    </>
  );
}
