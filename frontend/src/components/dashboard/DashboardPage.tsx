import React from 'react';
import { MetricCards } from './MetricCards';
import { AttentionTable } from './AttentionTable';
import { RightWidgets } from './RightWidgets';
import { allListings, mockLiveDates, mockActivities } from '../../data/mockData';
import type { AuthUser } from '../../api/auth';

interface DashboardPageProps {
  user: AuthUser;
  onNavigate?: (nav: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onNavigate }) => {
  const firstName = user.full_name.split(' ')[0];
  const liveDates = mockLiveDates;
  const activities = mockActivities;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here's what needs your attention today.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium pt-1">
          {formattedDate}
        </div>
      </div>

      <MetricCards />

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-8">
          <AttentionTable listings={allListings} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <RightWidgets liveDates={liveDates} activities={activities} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};
