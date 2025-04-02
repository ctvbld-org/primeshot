'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function AppHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 mt-[80px]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!</h2>
        <p className="text-muted-foreground">
          Here&apos;s your dashboard for managing your headshots.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Generate Headshots</CardTitle>
            <CardDescription>
              Create professional headshots from your photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Generating</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Gallery</CardTitle>
            <CardDescription>
              View and manage your generated headshots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">View Gallery</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/settings">
              <Button variant="outline" className="w-full">Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 