import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'secondary';
}

export function Card({ 
  children, 
  className = '', 
  hover = true, 
  variant = 'default' 
}: CardProps) {
  const baseClasses = 'rounded-xl shadow-sm border';
  const variantClasses = {
    default: 'bg-gray-800 border-gray-700',
    secondary: 'bg-gray-900 border-gray-800'
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}