export type PaymentType = 'visit' | 'monthly' | 'commission' | 'mixed' | 'none';
export type PaymentKind = 'visit' | 'monthly' | 'commission';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type VisitFrequency = 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type BiweeklyParity = 'even' | 'odd';

export type NoteKind = 'growth' | 'water' | 'soil' | 'talk' | 'other';
export type MediaType = 'audio' | 'photo' | 'video';

export type SkipReason = 'manual' | 'auto_frequency';

export type FarmStatus = 'pending' | 'visited' | 'skipped';
