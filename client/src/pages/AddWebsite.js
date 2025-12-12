import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addWebsite } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import './AddWebsite.css';

const AddWebsite = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    domain: '',
    description: '',
    employeesCount: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const employeeOptions = [
    { value: '', label: 'Select an employee count range' },
    { value: '1-10', label: '1 - 10 employees' },
    { value: '11-50', label: '11 - 50 employees' },
    { value: '51-100', label: '51 - 100 employees' },
    { value: '101-250', label: '101 - 250 employees' },
    { value: '251-500', label: '251 - 500 employees' },
    { value: '501-1000', label: '501 - 1,000 employees' },
    { value: '1001-5000', label: '1,001 - 5,000 employees' },
    { value: '5001-10000', label: '5,001 - 10,000 employees' },
    { value: '10000+', label: '10,000+ employees' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Domain validation
    if (!formData.domain.trim()) {
      newErrors.domain = 'Please enter your website domain to continue.';
    } else {
      const domainRegex = /^([a-z0-9]([a-z0-9\-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
      const normalizedDomain = formData.domain.toLowerCase().trim();
      
      // Check for http:// or https://
      if (normalizedDomain.includes('http://') || normalizedDomain.includes('https://')) {
        newErrors.domain = 'Please enter only the domain name without http:// or https:// (e.g., example.com).';
      } else if (!domainRegex.test(normalizedDomain)) {
        newErrors.domain = 'The domain format is invalid. Please enter a valid domain like example.com or subdomain.example.com.';
      } else if (normalizedDomain.length < 3 || normalizedDomain.length > 253) {
        newErrors.domain = 'Domain name must be between 3 and 253 characters in length.';
      }
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description of your website to help us understand its purpose.';
    } else {
      const descLength = formData.description.trim().length;
      if (descLength < 10) {
        newErrors.description = `Your description is too short. Please provide at least 10 characters (currently ${descLength}).`;
      } else if (descLength > 500) {
        newErrors.description = `Your description exceeds the maximum length. Please limit it to 500 characters (currently ${descLength}).`;
      }
    }

    // Employees count validation
    if (!formData.employeesCount) {
      newErrors.employeesCount = 'Please select the number of employees in your organization from the dropdown menu.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      toast.error('Please review and correct the highlighted fields before submitting the form.', {
        position: 'top-right',
        autoClose: 5000,
      });
      return false;
    }

    setLoading(true);

    try {
      const response = await addWebsite({
        domain: formData.domain.trim(),
        description: formData.description.trim(),
        employeesCount: formData.employeesCount
      });

      if (response.success && response.data?.website) {
        const websiteData = response.data.website;
        toast.success(`Successfully added ${websiteData.domain}! Your website has been added to your account with ID: ${websiteData.websiteId}.`, {
          position: 'top-right',
          autoClose: 4000,
        });
        
        // Reset form
        setFormData({
          domain: '',
          description: '',
          employeesCount: ''
        });
        setErrors({});
      }
    } catch (error) {
      // Check for duplicate website error specifically
      if (error.response?.status === 409 && error.response?.data?.message) {
        // For duplicate website, show the specific message from backend
        const duplicateMessage = error.response.data.message;
        toast.error(duplicateMessage, {
          position: 'top-right',
          autoClose: 6000,
        });
      } else {
        // For other errors, use the error handler
        const errorMessage = formatErrorForDisplay(error);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 6000,
        });
      }
      
      // Handle field-level errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.param || err.field || err.path;
          const message = err.msg || err.message;
          if (field && message) {
            apiErrors[field] = message;
          }
        });
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
        }
      }
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  return (
    <div className="add-website-container">
      <div className="add-website-header">
        <h1>Add New Website</h1>
        <p>Add your website to start using our services. Please provide accurate information about your website and business.</p>
      </div>

      <div className="add-website-card">
        <form onSubmit={handleSubmit} className="add-website-form" noValidate>
          <div className="form-group">
            <label htmlFor="domain">
              Domain Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              className={errors.domain ? 'error' : ''}
              placeholder="example.com"
              autoComplete="off"
            />
            {errors.domain && (
              <span className="error-message">{errors.domain}</span>
            )}
            <span className="form-hint">Enter your domain name without http:// or https:// (e.g., example.com)</span>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              placeholder="Provide a brief description of your website and its purpose (e.g., e-commerce store, corporate website, blog)..."
              rows="5"
              maxLength="500"
            />
            <div className="char-counter">
              {formData.description.length} / 500 characters
            </div>
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <span className="form-hint">Please provide a detailed description (minimum 10 characters)</span>
          </div>

          <div className="form-group">
            <label htmlFor="employeesCount">
              Number of Employees <span className="required">*</span>
            </label>
            <select
              id="employeesCount"
              name="employeesCount"
              value={formData.employeesCount}
              onChange={handleChange}
              className={errors.employeesCount ? 'error' : ''}
            >
              {employeeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.employeesCount && (
              <span className="error-message">{errors.employeesCount}</span>
            )}
            <span className="form-hint">Select the range that best represents your organization's size</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Website...' : 'Add Website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebsite;

