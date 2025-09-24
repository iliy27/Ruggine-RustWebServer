import { useState } from "react";
import { Button, Form, Row, Col, Badge, Alert } from "react-bootstrap";
import { FaPlus, FaTimes, FaUser, FaUsers } from "react-icons/fa";
import { createPrivateChat, createGroupChat } from "../API";

export default function InviteForm({ onClose, onChatCreated }) {
  const [formType, setFormType] = useState(null); // 'private' or 'group'
  const [username, setUsername] = useState("");
  const [groupName, setGroupName] = useState("");
  const [usernames, setUsernames] = useState([]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("danger");

  const resetForm = () => {
    setFormType(null);
    setUsername("");
    setGroupName("");
    setUsernames([]);
    setCurrentUsername("");
    setShowAlert(false);
    setAlertMessage("");
  };

  const handleAddUsername = () => {
    if (currentUsername.trim() && !usernames.includes(currentUsername.trim())) {
      setUsernames([...usernames, currentUsername.trim()]);
      setCurrentUsername("");
    } else if (usernames.includes(currentUsername.trim())) {
      setAlertMessage("Username already added");
      setAlertVariant("warning");
      setShowAlert(true);
    }
  };

  const handleRemoveUsername = (usernameToRemove) => {
    setUsernames(usernames.filter(u => u !== usernameToRemove));
  };

  const handleCreatePrivateChat = async () => {
    if (!username.trim()) {
      setAlertMessage("Please enter a username");
      setAlertVariant("danger");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // close after 3s
      return;
    }

    try {
      const response = await createPrivateChat(username.trim());
      if (response.already_exists) {
        setAlertMessage("A private chat with this user already exists. Redirecting...");
        setAlertVariant("warning");
        setShowAlert(true);

        if (onChatCreated) {
          onChatCreated(response.chat_id);
        }

        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500); // redirect: close after 1.5s
        return;
      }

      setAlertMessage("Private chat created successfully!");
      setAlertVariant("success");
      setShowAlert(true);

      if (onChatCreated) {
        onChatCreated(response.chat_id);
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500); // redirect: close after 1.5s
      } else {
        setTimeout(() => setShowAlert(false), 3000); // close after 3s
      }

    } catch (error) {
      if (error.response?.status === 404) {
        setAlertMessage("User not found. Please check the username.");
        setAlertVariant("danger");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000); // close after 3s
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           "Error creating private chat. Please try again.";
        setAlertMessage(errorMessage);
        setAlertVariant("danger");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000); // close after 3s
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setAlertMessage("Please enter a group name");
      setAlertVariant("danger");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // close after 3s
      return;
    }
    if (usernames.length === 0) {
      setAlertMessage("Please add at least one username");
      setAlertVariant("danger");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // close after 3s
      return;
    }
    
    try {
      const response = await createGroupChat(groupName.trim(), usernames);
      setAlertMessage(`Group "${groupName}" created successfully!`);
      setAlertVariant("success");
      setShowAlert(true);
        
        // Reload the chat list
      if (onChatCreated) {
        onChatCreated(response.chat_id);
      }
      
      // Close the form after a short delay to show the success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating group chat:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Error creating group. Please try again.";
      setAlertMessage(errorMessage);
      setAlertVariant("danger");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // close after 3s
    }
  };

  const handleBack = () => {
    setFormType(null);
    setShowAlert(false);
  };

  return (
    <>
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

      {formType === null && (
        <>
          <Button 
            variant="outline-primary" 
            className="w-100 mb-2"
            onClick={() => setFormType("private")}
          >
            <FaUser className="me-2" />
            Create private chat
          </Button>
          <Button 
            variant="outline-success" 
            className="w-100"
            onClick={() => setFormType("group")}
          >
            <FaUsers className="me-2" />
            Create group
          </Button>
        </>
      )}

      {formType === "private" && (
        <>
          <Form
            onSubmit={e => {
              e.preventDefault();
              handleCreatePrivateChat();
              setUsername(""); // clear the field after submission
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username to chat with"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="outline-secondary" onClick={handleBack}>
                Back
              </Button>
              <Button variant="primary" type="submit">
                Create Chat
              </Button>
            </div>
          </Form>
        </>
      )}

      {formType === "group" && (
        <>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Group Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Add Users</Form.Label>
              <Row>
                <Col xs={8}>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={currentUsername}
                    onChange={(e) => setCurrentUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUsername()}
                  />
                </Col>
                <Col xs={4}>
                  <Button 
                    variant="primary" 
                    className="w-100"
                    onClick={handleAddUsername}
                  >
                    <FaPlus />
                  </Button>
                </Col>
              </Row>
            </Form.Group>

            {usernames.length > 0 && (
              <div className="mb-3">
                <Form.Label>Users to invite ({usernames.length})</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {usernames.map((user, index) => (
                    <Badge 
                      key={index} 
                      bg="primary" 
                      className="d-flex align-items-center gap-1 p-2"
                    >
                      {user}
                      <FaTimes 
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRemoveUsername(user)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Form>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" onClick={handleBack}>
              Back
            </Button>
            <Button variant="success" onClick={handleCreateGroup}>
              Create Group
            </Button>
          </div>
        </>
      )}
    </>
  );
}