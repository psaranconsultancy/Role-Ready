import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A password box with a show/hide eye button, so people can check what they
// typed. Use it for every password field.

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput: React.FC<Props> = ({ className = '', ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute bottom-0 right-1 flex h-[44px] w-11 items-center justify-center rounded-full text-[#6e6e73] transition-colors hover:text-[#0369a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0284c7]"
      >
        {visible ? (
          <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
        ) : (
          <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};
