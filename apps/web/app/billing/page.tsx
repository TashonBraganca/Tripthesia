import { BillingDashboard } from "@/components/billing-dashboard";

export const metadata = {
  title: "Billing & Subscription",
  description: "Manage your Tripthesia subscription and billing",
};

export default function BillingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your subscription and view your current plan
        </p>
      </div>
      <BillingDashboard />
    </div>
  );
}