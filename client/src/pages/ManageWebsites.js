import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getWebsites, deleteWebsite } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import ConfirmModal from '../components/ConfirmModal';
import './ManageWebsites.css';

const ManageWebsites = () => {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, website: null });

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    filterAndSortWebsites();
  }, [websites, searchTerm, sortConfig]);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await getWebsites();
      if (response.success) {
        setWebsites(response.data.websites || []);
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortWebsites = () => {
    let filtered = [...websites];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(website =>
        website.domain.toLowerCase().includes(term) ||
        website.description?.toLowerCase().includes(term) ||
        website.websiteId.toLowerCase().includes(term) ||
        website.employeesCount?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle dates
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase() || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredWebsites(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteClick = (website) => {
    setDeleteModal({ isOpen: true, website });
  };

  const handleDeleteConfirm = async () => {
    const { website } = deleteModal;
    if (!website) return;

    try {
      setDeletingId(website._id);
      setDeleteModal({ isOpen: false, website: null });
      
      const response = await deleteWebsite(website._id);
      if (response.success) {
        toast.success(response.message || `Successfully deleted ${website.domain}.`, {
          position: 'top-right',
          autoClose: 3000,
        });
        // Remove from local state
        setWebsites(websites.filter(w => w._id !== website._id));
      }
    } catch (error) {
      const errorMessage = formatErrorForDisplay(error);
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, website: null });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10L12 15L17 10H7Z" fill="currentColor" opacity="0.3"/>
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 14L12 9L17 14H7Z" fill="currentColor"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="manage-websites-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-websites-container">
      <div className="manage-websites-header">
        <div>
          <h1>Manage Websites</h1>
          <p>View and manage all your registered websites</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/websites/add')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
          </svg>
          Add Website
        </button>
      </div>

      <div className="manage-websites-card">
        <div className="table-controls">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5S5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              placeholder="Search by domain, description, or website ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="table-info">
            {filteredWebsites.length} {filteredWebsites.length === 1 ? 'website' : 'websites'}
          </div>
        </div>

        {filteredWebsites.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V8H20V18ZM20 6H4V8H20V6Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <h3>{searchTerm ? 'No websites found' : 'No websites yet'}</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first website'}
            </p>
            {!searchTerm && (
              <button
                className="btn-primary"
                onClick={() => navigate('/dashboard/websites/add')}
              >
                Add Your First Website
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="websites-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('domain')} className="sortable">
                    <span>Domain</span>
                    {getSortIcon('domain')}
                  </th>
                  <th onClick={() => handleSort('description')} className="sortable">
                    <span>Description</span>
                    {getSortIcon('description')}
                  </th>
                  <th onClick={() => handleSort('employeesCount')} className="sortable">
                    <span>Employees</span>
                    {getSortIcon('employeesCount')}
                  </th>
                  <th onClick={() => handleSort('websiteId')} className="sortable">
                    <span>Website ID</span>
                    {getSortIcon('websiteId')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    <span>Added</span>
                    {getSortIcon('createdAt')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWebsites.map((website) => (
                  <tr key={website._id}>
                    <td>
                      <div className="domain-cell">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                        </svg>
                        <span className="domain-text">{website.domain}</span>
                      </div>
                    </td>
                    <td>
                      <div className="description-cell" title={website.description}>
                        {website.description || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="employees-badge">{website.employeesCount || 'Not specified'}</span>
                    </td>
                    <td>
                      <code className="website-id">{website.websiteId}</code>
                    </td>
                    <td>
                      <span className="date-text">{formatDate(website.createdAt)}</span>
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(website)}
                        disabled={deletingId === website._id}
                        title="Delete website"
                      >
                        {deletingId === website._id ? (
                          <div className="spinner-small"></div>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Website"
        message={
          deleteModal.website
            ? `Are you sure you want to delete this website? This action cannot be undone and will permanently remove the website and all its associated data.`
            : ''
        }
        confirmText="Delete Website"
        cancelText="Cancel"
        variant="danger"
        requireConfirmation={true}
        confirmationText={deleteModal.website?.domain || ''}
      />
    </div>
  );
};

export default ManageWebsites;

