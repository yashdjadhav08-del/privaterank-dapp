import React from 'react';

// AccessDeniedModal is no longer used — role is user-selected (ORGANIZER or PLAYER),
// so there is no concept of an "unauthorized organizer".
// Kept as a null component to avoid import errors.
export const AccessDeniedModal: React.FC = () => {
  return null;
};
