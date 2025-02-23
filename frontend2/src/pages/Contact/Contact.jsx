// src/pages/Contact/Contact.jsx
import React, { useState } from 'react';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [alert, setAlert] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    setAlert({
      type: 'success',
      message: 'Message sent successfully!'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <Card className="max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              rows="5"
              required
            ></textarea>
          </div>
          <Button type="submit">Send Message</Button>
        </form>
      </Card>

      <Card className="mt-8">
        <h2 className="text-xl font-bold mb-4">Other Ways to Reach Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold mb-2">Email</h3>
            <p className="text-gray-600">info@example.com</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Phone</h3>
            <p className="text-gray-600">(123) 456-7890</p>
          </div>
        </div>
      </Card>
    </div>
  );
}