import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { validateEmail } from '../utils/validators';

export const LoginPage: React.FC = () => {
  const { login, isSubmitting, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    setEmailError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error handled by context
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-ink-900">
          Sign in to your account
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
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError || undefined}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-ink-500">
                  New to AI Interview Coach?
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
                Create an account
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
