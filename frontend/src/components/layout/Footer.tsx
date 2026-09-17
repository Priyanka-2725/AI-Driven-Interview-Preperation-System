import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface rounded-lg m-4 border border-surface-border">
      <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-ink-500 sm:text-center">
          © 2026 AI Interview Coach. Academic capstone project.
        </span>
      </div>
    </footer>
  );
};
