// src/pages/About/About.jsx
import React from 'react';
import Card from '../../components/Card/Card';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About Us</h1>
      <Card className="mb-8">
        <p className="text-gray-600 mb-4">
          Your company description and story goes here. This is where you can
          tell visitors about your mission, vision, and values.
        </p>
      </Card>
      
      <h2 className="text-2xl font-bold mb-4">Our Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <img
            src="/placeholder-person.jpg"
            alt="Team Member"
            className="w-full h-48 object-cover mb-4 rounded"
          />
          <h3 className="text-xl font-bold mb-2">John Doe</h3>
          <p className="text-gray-600">CEO & Founder</p>
        </Card>
        <Card>
          <img
            src="/placeholder-person.jpg"
            alt="Team Member"
            className="w-full h-48 object-cover mb-4 rounded"
          />
          <h3 className="text-xl font-bold mb-2">Jane Smith</h3>
          <p className="text-gray-600">CTO</p>
        </Card>
        <Card>
          <img
            src="/placeholder-person.jpg"
            alt="Team Member"
            className="w-full h-48 object-cover mb-4 rounded"
          />
          <h3 className="text-xl font-bold mb-2">Mike Johnson</h3>
          <p className="text-gray-600">Lead Developer</p>
        </Card>
      </div>
    </div>
  );
}
