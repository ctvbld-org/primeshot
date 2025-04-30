'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>&nbsp;</CardTitle>
          <CardDescription>&nbsp;</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]" />
        </CardContent>
      </Card>
    </div>
  );
} 