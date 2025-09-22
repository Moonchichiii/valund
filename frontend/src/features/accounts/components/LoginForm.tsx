import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useBankIDAuth, useGeographicAccess, useLogin } from '../hooks/useAuth'

export const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const bankid = useBankIDAuth()
  const { data: geoAccess, isLoading: geoLoading } = useGeographicAccess()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password }, { onSuccess: () => navigate({ to: '/app/dashboard' }) })
  }

  const startBankID = () => {
    bankid.mutate(undefined, { onSuccess: () => navigate({ to: '/app/dashboard' }) })
  }

  const bankIdDisabled = geoLoading || geoAccess?.canUseBankID === false

  return (
    <div className="card-nordic p-6">
      <h1 className="heading-2 mb-6">Sign in</h1>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="input-nordic w-full" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); }} required data-testid="email-input" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="input-nordic w-full" type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); }} required data-testid="password-input" />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 text-center text-text-muted">or</div>

      <button
        className="btn-secondary w-full"
        onClick={startBankID}
        disabled={bankIdDisabled || bankid.isPending}
        data-testid="bankid-btn"
        title={geoAccess?.canUseBankID === false ? 'BankID is only available from Swedish IP addresses' : undefined}
      >
        {bankid.isPending ? 'Starting BankID…' : 'Sign in with BankID'}
      </button>

      <div className="mt-6 text-sm text-text-secondary text-center">
        No account? <Link to="/register" className="link">Create one</Link>
      </div>
    </div>
  )
}
