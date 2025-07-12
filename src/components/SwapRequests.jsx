import React, { useState, useEffect } from 'react';

const SwapRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    feedback: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/swaps/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.swapRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/swaps/${action}/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchRequests(); // Refresh the list
        alert(`Request ${action}ed successfully!`);
      } else {
        const data = await response.json();
        alert(data.message || `Failed to ${action} request`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleCancel = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/swaps/cancel/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchRequests();
        alert('Request cancelled successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel request');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const openRatingModal = (request) => {
    setSelectedRequest(request);
    setShowRatingModal(true);
  };

  const submitRating = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const otherUserId = selectedRequest.fromUser._id === user._id 
        ? selectedRequest.toUser._id 
        : selectedRequest.fromUser._id;

      const response = await fetch('http://localhost:5000/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          swapRequestId: selectedRequest._id,
          toUserId: otherUserId,
          rating: ratingForm.rating,
          feedback: ratingForm.feedback
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRatingModal(false);
        setSelectedRequest(null);
        setRatingForm({ rating: 5, feedback: '' });
        fetchRequests();
        alert('Rating submitted successfully!');
      } else {
        alert(data.message || 'Failed to submit rating');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      rejected: 'badge-rejected',
      completed: 'badge-completed',
      cancelled: 'badge-rejected'
    };
    return `badge ${statusClasses[status] || 'badge-pending'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Swap Requests</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
        {['all', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              activeTab === tab
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request._id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {request.fromUser._id === user._id 
                    ? `To: ${request.toUser.name}`
                    : `From: ${request.fromUser.name}`
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={getStatusBadge(request.status)}>
                {request.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-800 mb-3">{request.message}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Skills Offered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {request.skillsOffered.map((skill, index) => (
                      <span key={index} className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Skills Requested:</h4>
                  <div className="flex flex-wrap gap-1">
                    {request.skillsRequested.map((skill, index) => (
                      <span key={index} className="text-xs bg-green-100 px-2 py-1 rounded text-green-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {request.status === 'pending' && request.toUser._id === user._id && (
                <>
                  <button
                    onClick={() => handleAction(request._id, 'accept')}
                    className="btn btn-success"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(request._id, 'reject')}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </>
              )}

              {request.status === 'pending' && request.fromUser._id === user._id && (
                <button
                  onClick={() => handleCancel(request._id)}
                  className="btn btn-danger"
                >
                  Cancel
                </button>
              )}

              {request.status === 'accepted' && (
                <button
                  onClick={() => handleAction(request._id, 'complete')}
                  className="btn btn-primary"
                >
                  Mark as Completed
                </button>
              )}

              {request.status === 'completed' && (
                <button
                  onClick={() => openRatingModal(request)}
                  className="btn btn-secondary"
                >
                  Rate & Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No {activeTab} requests found.</p>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Rate Your Experience
              </h2>

              <form onSubmit={submitRating}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    value={ratingForm.rating}
                    onChange={(e) => setRatingForm({...ratingForm, rating: parseInt(e.target.value)})}
                    className="form-input"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={3}>3 - Good</option>
                    <option value={2}>2 - Fair</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback (optional)</label>
                  <textarea
                    value={ratingForm.feedback}
                    onChange={(e) => setRatingForm({...ratingForm, feedback: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="Share your experience..."
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    Submit Rating
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRequests; 