import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useRegister } from '../hooks/useAuth'

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()
  const register = useRegister()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const canSubmit = form.email && form.password && form.first_name && form.last_name && form.password === form.confirm

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    register.mutate(
      { email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name },
      { onSuccess: () => navigate({ to: '/app/dashboard' }) },
    )
  }

  return (
    <div className="card-nordic p-6">
      <h1 className="heading-2 mb-6">Create account</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm mb-1">First name</label><input className="input-nordic w-full" name="first_name" value={form.first_name} onChange={onChange} required /></div>
          <div><label className="block text-sm mb-1">Last name</label><input className="input-nordic w-full" name="last_name" value={form.last_name} onChange={onChange} required /></div>
        </div>
        <div><label className="block text-sm mb-1">Email</label><input className="input-nordic w-full" type="email" name="email" value={form.email} onChange={onChange} required /></div>
        <div><label className="block text-sm mb-1">Password</label><input className="input-nordic w-full" type="password" name="password" value={form.password} onChange={onChange} required /></div>
        <div><label className="block text-sm mb-1">Confirm password</label><input className="input-nordic w-full" type="password" name="confirm" value={form.confirm} onChange={onChange} required /></div>
        <button className="btn-primary w-full" type="submit" disabled={register.isPending || !canSubmit}>{register.isPending ? 'Creating account…' : 'Create account'}</button>
      </form>
      <div className="mt-6 text-sm text-text-secondary text-center">Already have an account? <Link to="/login" className="link">Sign in</Link></div>
    </div>
  )
}
