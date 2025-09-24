import { Modal, Button, Form, Row, Col, Badge, Alert } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";

export default function InviteUsersModal({ 
  show, 
  onHide, 
  inviteUsername, 
  inviteUsernames, 
  inviteAlert, 
  onInviteUsernameChange, 
  onAddInviteUsername, 
  onRemoveInviteUsername, 
  onInviteUsers, 
  onAlertClose 
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onAddInviteUsername();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <TiUserAdd className="me-2" /> Invite Users
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {inviteAlert.show && (
          <Alert
            variant={inviteAlert.variant}
            dismissible
            onClose={onAlertClose}
          >
            {inviteAlert.message}
          </Alert>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Add Users</Form.Label>
          <Row>
            <Col xs={8}>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={inviteUsername}
                onChange={(e) => onInviteUsernameChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </Col>
            <Col xs={4}>
              <Button variant="success" className="w-100" onClick={onAddInviteUsername}>
                <FaPlus />
              </Button>
            </Col>
          </Row>
        </Form.Group>
        {inviteUsernames.length > 0 && (
          <div>
            {inviteUsernames.map((u, i) => (
              <Badge key={i} bg="success" className="me-2">
                {u}{" "}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-white"
                  onClick={() => onRemoveInviteUsername(u)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={onInviteUsers} disabled={!inviteUsernames.length}>
          Invite
        </Button>
      </Modal.Footer>
    </Modal>
  );
}