import { Modal, Button } from "react-bootstrap";
import { FaSignOutAlt } from "react-icons/fa";

export default function LeaveGroupModal({ 
  show, 
  onHide, 
  onLeaveGroup 
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>
          <FaSignOutAlt className="me-2" /> Leave Group
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to leave this group?<br />
        You will no longer see messages or participate.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onLeaveGroup}>
          Leave
        </Button>
      </Modal.Footer>
    </Modal>
  );
}