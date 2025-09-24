import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaUser,
  FaLock,
  FaUserPlus,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { loginUser, registerUser } from "../API";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    password: "",
    confirmPassword: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Hide alert after 3 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.password) {
      setAlertMessage("Username and password are required");
      setAlertVariant("danger");
      setShowAlert(true);
      return;
    }

    if (!isLogin && (!formData.name || !formData.surname)) {
      setAlertMessage("Name and surname are required for registration");
      setAlertVariant("danger");
      setShowAlert(true);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setAlertMessage("Password and confirm password must match");
      setAlertVariant("danger");
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // API call for login
        const response = await loginUser({
          username: formData.username,
          password: formData.password,
        });
        setAlertMessage("Login successful!");
        setAlertVariant("success");
        setShowAlert(true);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", formData.username);
        if (onLoginSuccess) onLoginSuccess();
        navigate("/chats");
      } else {
        // API call for registration
        const response = await registerUser({
          username: formData.username,
          name: formData.name,
          surname: formData.surname,
          password: formData.password,
        });
        setAlertMessage("Registration successful! Redirecting to login...");
        setAlertVariant("success");
        setShowAlert(true);
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            username: "",
            name: "",
            surname: "",
            password: "",
            confirmPassword: "",
          });
          setShowAlert(false);
        }, 2000);
      }
    } catch (error) {
      // Extract error message from server if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Authentication failed. Please try again.";
      
      setAlertMessage(errorMessage);
      setAlertVariant("danger");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: "",
      name: "",
      surname: "",
      password: "",
      confirmPassword: "",
    });
    setShowAlert(false);
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light"
      style={{ minHeight: "100vh", padding: 0 }}
    >
      <Row
        className="w-100 justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Col
          xs={12}
          md={8}
          className="d-flex flex-column align-items-center justify-content-center"
          style={{
            minHeight: "100vh",
            padding: "2rem",
          }}
        >
          <Col xs={12} md={8} className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="d-flex align-items-center justify-content-center mb-3" style={{ gap: 18, marginTop: '-24px' }}>
              <img
                src={logo}
                alt="Ruggine Logo"
                style={{ maxHeight: "64px", maxWidth: "64px" }}
              />
              <span className="fw-bold text-dark" style={{ fontSize: 36, letterSpacing: 1 }}>
                Welcome to Ruggine
              </span>
            </div>
            <Card className="shadow-lg border-0 rounded-lg w-100" style={{ maxWidth: 540 }}>
              <Card.Header className="bg-primary text-white text-center py-4">
                <h3 className="mb-0">
                  {isLogin ? (
                    <>
                      <FaSignInAlt className="me-2" />
                      Login
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="me-2" />
                      Register an account
                    </>
                  )}
                </h3>
              </Card.Header>
              <Card.Body className="p-4">
                {showAlert && (
                  <Alert
                    variant={alertVariant}
                    dismissible
                    onClose={() => setShowAlert(false)}
                    className="mb-3"
                  >
                    {alertMessage}
                  </Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaUser className="me-2" />
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  {!isLogin && (
                    <Row className="mb-3">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label>Surname</Form.Label>
                          <Form.Control
                            type="text"
                            name="surname"
                            value={formData.surname}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaLock className="me-2" />
                      Password
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        tabIndex={-1}
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                        style={{ borderLeft: "none" }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  {!isLogin && (
                    <Form.Group className="mb-4">
                      <Form.Label>Confirm Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          tabIndex={-1}
                          onMouseDown={() => setShowConfirmPassword(true)}
                          onMouseUp={() => setShowConfirmPassword(false)}
                          onMouseLeave={() => setShowConfirmPassword(false)}
                          style={{ borderLeft: "none" }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  )}

                  <div className="d-grid gap-2 mb-3">
                    <Button
                      variant="primary"
                      type="submit"
                      size="lg"
                      className="fw-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          {isLogin ? "Logging in..." : "Registering..."}
                        </>
                      ) : isLogin ? (
                        "Login"
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </div>

                  <div className="d-grid gap-2">
                    {isLogin ? (
                      <Button
                        variant="outline-secondary"
                        onClick={toggleAuthMode}
                        className="fw-bold"
                      >
                        Registration
                      </Button>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        onClick={toggleAuthMode}
                        className="fw-bold"
                      >
                        Back to Login
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Col>
      </Row>
    </Container>
  );
}
