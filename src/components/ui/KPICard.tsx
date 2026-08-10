import { type ReactNode } from "react";
import { Card, CardContent } from "./Card";
import { CardSkeleton } from "./Skeleton";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function KPICard({ title, value, subtitle, icon, loading = false }: KPICardProps) {
  if (loading) return <CardSkeleton />;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {icon && <span className="text-gray-400">{icon}</span>}
        </div>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
