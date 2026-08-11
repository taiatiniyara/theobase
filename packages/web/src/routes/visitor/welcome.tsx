import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { postChurchMutation } from '../../lib/api';

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

  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const churchId = search.get('churchId') || 'default-church';

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await postChurchMutation(churchId, 'visitor:follow-up', {
      churchId,
      name,
      email: email || null,
      phone: phone || null,
      message: message || null,
    });
    setLoading(false);
    setSubmitted(true);
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
          <p className="text-neutral-500 mt-2">We're glad you're here.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-600"><strong>Service Times:</strong> Saturday 9:30 AM</p>
            <p className="text-sm text-neutral-600"><strong>Sabbath School:</strong> Saturday 9:30 AM</p>
          </div>

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
              <Input required placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <Input type="email" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
              <Input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input placeholder="Message (optional)" value={message} onChange={e => setMessage(e.target.value)} />
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
