"use client";

import React from 'react';

interface TagProps {
  title: string;
  color: string;
}

const Tag: React.FC<TagProps> = ({ title, color }) => {
  return (
    <div 
      className={`tag tag-${color}`}
    >
      {title}
    </div>
  );
}

export default Tag;