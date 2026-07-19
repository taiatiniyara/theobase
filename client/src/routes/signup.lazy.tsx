import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-xl font-bold text-white">
            T
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Register your church</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up your local church to get started with Theobase.
          </p>
        </div>
        <form className="space-y-4">
          <div>
            <label htmlFor="church" className="block text-sm font-medium text-gray-700">
              Church name
            </label>
            <input
              id="church"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Suva Central SDA Church"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
              Clerk email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="clerk@example.org"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Submit registration
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{' '}
          <a href="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
