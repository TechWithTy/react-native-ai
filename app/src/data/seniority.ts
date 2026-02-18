
import { SeniorityOption } from './types/seniority';

export const TARGET_SENIORITY_OPTIONS: SeniorityOption[] = [
  { label: 'Junior', subtitle: '0-2 Years', icon: 'book-open', legacy: 'Entry Level' },
  { label: 'Mid-Level', subtitle: '3-5 Years', icon: 'trending-up', legacy: 'Mid-level' },
  { label: 'Senior', subtitle: '5-8 Years', icon: 'award', legacy: 'Senior' },
  { label: 'Lead', subtitle: '8+ Years', icon: 'star', legacy: 'Lead' },
  { label: 'Executive', subtitle: '12+ Years', icon: 'briefcase', legacy: 'Executive' },
];
