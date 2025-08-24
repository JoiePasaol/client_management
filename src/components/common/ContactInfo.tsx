import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactInfoProps {
  email: string;
  phoneNumber: string;
  address: string;
  className?: string;
}

export function ContactInfo({ email, phoneNumber, address, className = '' }: ContactInfoProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-700 rounded-lg">
          <Mail className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-300 truncate">{email}</p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-700 rounded-lg">
          <Phone className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-300">{phoneNumber}</p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-700 rounded-lg">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-300 truncate">{address}</p>
      </div>
    </div>
  );
}