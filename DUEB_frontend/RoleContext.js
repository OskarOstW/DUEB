// RoleContext.js
import React from 'react';

const RoleContext = React.createContext({
  role: 'Observer', // Standardrolle
  setRole: () => {}, // Platzhalterfunktion
});

export default RoleContext;
