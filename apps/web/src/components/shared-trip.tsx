"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SharedTripProps {
  token: string;
}

export function SharedTrip({ token }: SharedTripProps) {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Shared Trip View</CardTitle>
          <CardDescription>Token: {token}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Shared trip view will be implemented here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}