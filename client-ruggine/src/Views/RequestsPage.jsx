import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { FaCheck, FaTimes, FaUsers, FaInbox } from 'react-icons/fa';
import { getUserRequests, acceptInvitation, rejectInvitation } from "../API";
import { useNavigate } from 'react-router-dom';

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState('success');
    const navigate = useNavigate();

    // Load requests on component mount
    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await getUserRequests();
            setRequests(response || []);
        } catch (error) {
            console.error('Error loading requests:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Error loading requests. Please try again.';
            setAlertMessage(errorMessage);
            setAlertVariant('danger');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (chatId) => {
        try {
            await acceptInvitation(chatId);
            setAlertMessage('Invitation accepted successfully!');
            setAlertVariant('success');
            setShowAlert(true);
            // Remove the request from the local list
            setRequests(prev => prev.filter(req => req.chat_id !== chatId));

            // Signal that chats need to be reloaded
            localStorage.setItem('shouldRefreshChats', 'true');

            // Save the selected chat for the ChatsPage
            localStorage.setItem('selectedChatId', chatId);

            // Hide the alert after 3 seconds and redirect to ChatsPage
            setTimeout(() => {
                setShowAlert(false);
                navigate('/chats');
            }, 800); // brief delay to show alert
        } catch (error) {
            console.error('Error accepting invitation:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Error accepting invitation. Please try again.';
            setAlertMessage(errorMessage);
            setAlertVariant('danger');
            setShowAlert(true);

            // Hide the alert after 3 seconds even in case of error
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);
        }
    };

    const handleRejectInvitation = async (chatId) => {
        try {
            await rejectInvitation(chatId);
            setAlertMessage('Invitation rejected successfully!');
            setAlertVariant('info');
            setShowAlert(true);
            // Remove the request from the local list
            setRequests(prev => prev.filter(req => req.chat_id !== chatId));
            
            // Hide the alert after 3 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Error rejecting invitation. Please try again.';
            setAlertMessage(errorMessage);
            setAlertVariant('danger');
            setShowAlert(true);

            // Hide the alert after 3 seconds even in case of error
            setTimeout(() => {
                setShowAlert(false);
            }, 3000);
        }
    };

    return (
        <Container fluid className="min-vh-100 bg-light py-4">
            <Row>
                <Col xs={12} md={8} lg={6} className="mx-auto">
                    <Card className="shadow-lg border-0 rounded-lg">
                        <Card.Header className="bg-primary text-white text-center py-4">
                            <h3 className="mb-0">
                                <FaInbox className="me-2" />
                                Group Invitations
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

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Loading your invitations...</p>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaInbox size={48} className="text-muted mb-3" />
                                    <h5 className="text-muted">No pending invitations</h5>
                                    <p className="text-muted">You don't have any group invitations at the moment.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <Badge bg="primary" className="fs-6">
                                            {requests.length} pending invitation{requests.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                    
                                    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                                      <ListGroup variant="flush">
                                        {requests.map((request) => (
                                            <ListGroup.Item key={request.chat_id} className="border-0 bg-light rounded mb-2 p-3">
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
                                                                onClick={() => handleAcceptInvitation(request.chat_id)}
                                                                className="fw-bold"
                                                            >
                                                                <FaCheck className="me-1" />
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRejectInvitation(request.chat_id)}
                                                                className="fw-bold"
                                                            >
                                                                <FaTimes className="me-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                      </ListGroup>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}