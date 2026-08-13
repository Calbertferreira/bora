"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
};

export function PasswordField({ label, name, autoComplete, placeholder, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return <label>{label}
    <span className="password-input">
      <input
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        title={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </span>
  </label>;
}
