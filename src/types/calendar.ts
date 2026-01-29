export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string;
  status: string;
  organizer: string | null;
  attendees: Array<{
    email: string;
    responseStatus: string;
  }>;
  colorId?: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  summary?: string;
  timeZone?: string;
  error?: string;
  needsConnection?: boolean;
  needsReconnection?: boolean;
  message?: string;
}
