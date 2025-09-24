import { Modal, Button, Badge } from "react-bootstrap";
import { FaUsers } from "react-icons/fa";

export default function GroupInfoModal({ 
  show, 
  onHide, 
  selectedChatData, 
  username 
}) {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaUsers className="me-2" /> Group Information
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedChatData?.type === "group" && (
          <>
            <h5 className="text-primary mb-2">{selectedChatData.name}</h5>
            <small className="text-muted">
              <strong>Created:</strong> {formatDate(selectedChatData.created_at)}
            </small>
            <h6 className="mt-3">Participants ({selectedChatData.participants.length + 1})</h6>
            <Badge bg="primary" className="me-2">{username} (You)</Badge>
            {selectedChatData.participants.map((p, i) => (
              <Badge key={i} bg="secondary" className="me-2">{p}</Badge>
            ))}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}