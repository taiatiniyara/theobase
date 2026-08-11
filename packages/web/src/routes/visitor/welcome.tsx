import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { postChurchMutation } from '../../lib/api';
import { useToast } from '../../lib/toast';

export const Route = createFileRoute('/visitor/welcome')({
  component: VisitorWelcomePage,
});

function VisitorWelcomePage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const _queryClient = useQueryClient();
  void _queryClient;

  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const churchId = search.get('churchId') || 'default-church';

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await postChurchMutation(churchId, 'visitor:follow-up', {
        churchId,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
      });
      if (res.ok) {
        setSubmitted(true);
        toast('Follow-up request sent', 'success');
      } else {
        setError('Failed to send request. Please try again.');
        toast('Failed to send follow-up request', 'error');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function retryFormSubmission() {
    setError(null);
    setLoading(true);
    try {
      const res = await postChurchMutation(churchId, 'visitor:follow-up', {
        churchId,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
      });
      if (res.ok) {
        setSubmitted(true);
        toast('Follow-up request sent', 'success');
      } else {
        setError('Failed to send request. Please try again.');
        toast('Failed to send follow-up request', 'error');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      toast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">Thank You!</h2>
            <p className="mt-2 text-neutral-500">Someone from the church will follow up with you soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md space-y-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Our Church!</CardTitle>
          <p className="mt-2 text-neutral-500">We're glad you're here.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-sm text-neutral-600"><strong>Service Times:</strong> Saturday 9:30 AM</p>
            <p className="text-sm text-neutral-600"><strong>Sabbath School:</strong> Saturday 9:30 AM</p>
          </div>

          {error && (
            <div className="flex flex-col gap-2 rounded-md bg-error-light px-4 py-3">
              <p className="text-sm text-error-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => retryFormSubmission()} disabled={loading}>
                Retry
              </Button>
            </div>
          )}
          {!showForm ? (
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => setShowForm(true)} className="w-full">
                Request Follow-Up
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                No Thanks
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFollowUp} className="space-y-4 pt-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Your Name</span>
                <Input required value={name} onChange={e => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Email (optional)</span>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Phone (optional)</span>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Message (optional)</span>
                <Input value={message} onChange={e => setMessage(e.target.value)} />
              </label>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
