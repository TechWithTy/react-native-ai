
export type RoleTrack = 'Engineering' | 'Design' | 'Product' | 'Data';

export interface TrackMetadata {
  label: RoleTrack;
  icon: string;
  color: string;
  bgColor: string;
}
