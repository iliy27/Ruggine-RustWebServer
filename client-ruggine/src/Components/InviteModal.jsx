import { Modal } from "react-bootstrap";
import InviteForm from "./InviteForm";

export default function InviteModal({ show, onHide, onChatCreated }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>New chat or group</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InviteForm onClose={onHide} onChatCreated={onChatCreated} />
      </Modal.Body>
    </Modal>
  );
}