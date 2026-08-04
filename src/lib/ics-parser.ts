export interface ICSEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

export function parseICS(icsText: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const blocks = icsText.split('BEGIN:VEVENT');
  
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const event: Partial<ICSEvent> = { isAllDay: false };

    const getValue = (key: string): string | undefined => {
      const regex = new RegExp(`${key}(?:;.*?)?:(.*?)(?:\\r?\\n|$)`, 'i');
      const match = block.match(regex);
      if (!match) return undefined;
      // Handle folded lines (continuations starting with space)
      let value = match[1];
      const rest = block.slice(block.indexOf(match[0]) + match[0].length);
      const continuation = rest.match(/^[ \t](.+)/m);
      if (continuation) value += continuation[1];
      return value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\;/g, ';').replace(/\\\\/g, '\\').trim();
    };

    event.title = getValue('SUMMARY') || 'Untitled';
    event.uid = getValue('UID') || crypto.randomUUID();
    event.location = getValue('LOCATION');
    event.description = getValue('DESCRIPTION');

    const dtStart = getValue('DTSTART');
    const dtEnd = getValue('DTEND');

    if (dtStart) {
      event.start = parseICalDate(dtStart);
      // Check if all-day (date only, no time)
      if (dtStart.length === 8) event.isAllDay = true;
    }
    if (dtEnd) {
      event.end = parseICalDate(dtEnd);
    } else if (event.start) {
      event.end = new Date(event.start.getTime() + 60 * 60 * 1000); // default 1 hour
    }

    if (event.title && event.start) {
      events.push(event as ICSEvent);
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function parseICalDate(icalStr: string): Date {
  try {
    const year = parseInt(icalStr.slice(0, 4)) || new Date().getFullYear();
    const month = (parseInt(icalStr.slice(4, 6)) || 1) - 1;
    const day = parseInt(icalStr.slice(6, 8)) || 1;

    if (icalStr.length >= 15 && icalStr.includes('T')) {
      const hour = parseInt(icalStr.slice(9, 11)) || 0;
      const min = parseInt(icalStr.slice(11, 13)) || 0;
      const sec = parseInt(icalStr.slice(13, 15)) || 0;
      if (icalStr.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, min, sec));
      }
      return new Date(year, month, day, hour, min, sec);
    }

    return new Date(year, month, day);
  } catch {
    return new Date();
  }
}

export async function fetchICSFeed(url: string): Promise<ICSEvent[]> {
  let text = '';

  // Try direct fetch first — Google ICS feeds support CORS
  try {
    const response = await fetch(url);
    if (response.ok) {
      text = await response.text();
    }
  } catch { /* direct fetch failed, try proxies */ }

  // Fallback to CORS proxies
  if (!text) {
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          text = await response.text();
          break;
        }
      } catch { continue; }
    }
  }

  if (!text) throw new Error('Could not fetch calendar. Check the URL or try again later.');
  return parseICS(text);
}

export function generateGoogleCalendarLink(event: {
  title: string;
  startDate: string; // YYYYMMDD or YYYYMMDDTHHMMSS
  endDate: string;
  details?: string;
  location?: string;
}): string {
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.title);
  params.set('dates', `${event.startDate}/${event.endDate}`);
  if (event.details) params.set('details', event.details);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
