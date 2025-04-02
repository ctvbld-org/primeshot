import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data, error
  } = await supabase.auth.getUser();

  if (!data.user || error) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b flex justify-center">
        <div className="container flex h-16 items-center px-4">
          <div className="flex flex-1 items-center justify-between">
            <nav className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Primeshot</h1>
            </nav>
            <form
              action="/auth/signout"
              method="post"
            >
              <Button variant="ghost">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
} 