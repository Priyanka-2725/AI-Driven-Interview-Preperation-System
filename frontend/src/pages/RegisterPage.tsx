import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { validateEmail, validatePassword, validateFullName } from '../utils/validators';

export const RegisterPage: React.FC = () => {
  const { register, isSubmitting, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const fullNameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (fullNameErr || emailErr || passwordErr) {
      setErrors({
        fullName: fullNameErr || undefined,
        email: emailErr || undefined,
        password: passwordErr || undefined,
      });
      return;
    }
    setErrors({});

    try {
      await register(fullName, email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error handled by context
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-ink-900">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert tone="danger" onDismiss={clearError}>
                {error}
              </Alert>
            )}

            <Input
              label="Full name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
              }}
              error={errors.fullName}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              hint="Must be at least 8 characters with 1 letter and 1 number."
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Register
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-ink-500">
                  Already have an account?
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
                Sign in instead
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
