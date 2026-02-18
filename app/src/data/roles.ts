
import { TrackMetadata } from './types/roles';

export const ROLE_TRACKS_META: TrackMetadata[] = [
  { label: 'Engineering', icon: 'code', color: '#0d6cf2', bgColor: '#eff6ff' },
  { label: 'Design', icon: 'palette', color: '#a855f7', bgColor: '#f3e8ff' },
  { label: 'Product', icon: 'lightbulb', color: '#f97316', bgColor: '#ffedd5' },
  { label: 'Data', icon: 'bar-chart', color: '#22c55e', bgColor: '#dcfce7' },
];

export const ROLE_OPTIONS_BY_TRACK: Record<string, string[]> = {
  Engineering: [
    'Software Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Mobile Engineer',
    'DevOps Engineer',
  ],
  Design: [
    'Product Designer',
    'UX Designer',
    'UI Designer',
    'Interaction Designer',
    'Design Systems Designer',
  ],
  Product: [
    'Product Manager',
    'Senior Product Manager',
    'Growth Product Manager',
    'Technical Product Manager',
    'Product Lead',
  ],
  Data: [
    'Data Analyst',
    'Data Scientist',
    'Analytics Engineer',
    'Machine Learning Engineer',
    'Business Intelligence Analyst',
  ],
};
