import { Row, Col, ListGroup, Button } from 'react-bootstrap';
import { FaCheck, FaTimes, FaUsers } from 'react-icons/fa';

export default function RequestItem({ request, onAccept, onReject }) {
    return (
        <ListGroup.Item className="border-0 bg-light rounded mb-2 p-3">
            <Row className="align-items-center">
                <Col xs={12} md={8}>
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                        <FaUsers className="text-primary me-3" size={20} />
                        <div>
                            <h6 className="mb-1 fw-bold">{request.name}</h6>
                            <small className="text-muted">
                                Invited by: <span className="fw-semibold">{request.from}</span>
                            </small>
                        </div>
                    </div>
                </Col>
                <Col xs={12} md={4}>
                    <div className="d-flex gap-2 justify-content-md-end">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => onAccept(request.chat_id)}
                            className="fw-bold"
                        >
                            <FaCheck className="me-1" />
                            Accept
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onReject(request.chat_id)}
                            className="fw-bold"
                        >
                            <FaTimes className="me-1" />
                            Reject
                        </Button>
                    </div>
                </Col>
            </Row>
        </ListGroup.Item>
    );
}
