'use client';

// AdminDashboard is intentionally kept as a named re-export
// so other files importing it don't break. The real dashboard
// logic lives in AdminHomeClient which gets all server props.
export { AdminHomeClient as AdminDashboard } from '@/components/admin/admin-home-client';
