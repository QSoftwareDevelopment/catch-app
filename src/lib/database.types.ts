/**
 * Shape of the Postgres schema, hand-written to match
 * `supabase/migrations/0001_businesses.sql`.
 *
 * Once the project is live this can be regenerated instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

import type { SectorId } from '@/sectors/sectors';

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  sector: SectorId;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        // Inserts happen in the signup trigger, never from the client — there is no
        // insert policy. Typed for completeness only.
        Insert: Pick<Business, 'owner_id' | 'name' | 'sector'> & Partial<Business>;
        Update: Partial<Pick<Business, 'name' | 'sector'>>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
