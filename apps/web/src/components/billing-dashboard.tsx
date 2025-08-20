"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BillingDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Free Plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Features included:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• 5 trip plans per month</li>
                <li>• Basic itinerary generation</li>
                <li>• Community support</li>
              </ul>
            </div>
            <Button>Upgrade to Pro</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}