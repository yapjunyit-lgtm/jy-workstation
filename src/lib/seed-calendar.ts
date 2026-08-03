import { db } from './db';
import { generateId } from './utils';
import { BLOCK_COLORS } from './constants';
import { addDays, startOfWeek, format, getDate } from 'date-fns';
import type { TimeBlock } from './types';

export async function seedCalendarBlocks() {
  const count = await db.timeBlocks.count();
  if (count > 0) return;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const blocks: TimeBlock[] = [];
  const daysToSeed = 14; // 2 weeks

  for (let i = 0; i < daysToSeed; i++) {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const day = date.getDay();
    const dayOfMonth = getDate(date);
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // Monday–Friday: work shift + commute
    if (day >= 1 && day <= 5) {
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 8, endHour: 8.5,
        type: 'commute', label: 'Commute', color: BLOCK_COLORS['commute'],
      });
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 8.5, endHour: 17.5,
        type: 'work-shift', label: 'Work', color: BLOCK_COLORS['work-shift'],
      });
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 17.5, endHour: 18,
        type: 'commute', label: 'Commute', color: BLOCK_COLORS['commute'],
      });
    }

    // 1st & last Saturday: saturday shift
    if (day === 6 && (weekOfMonth === 1 || weekOfMonth >= 4)) {
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 8, endHour: 8.5,
        type: 'commute', label: 'Commute', color: BLOCK_COLORS['commute'],
      });
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 8.5, endHour: 17.5,
        type: 'sat-shift', label: 'Saturday Shift', color: BLOCK_COLORS['sat-shift'],
      });
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 17.5, endHour: 18,
        type: 'commute', label: 'Commute', color: BLOCK_COLORS['commute'],
      });
    }

    // Sunday: study blocks
    if (day === 0) {
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 10, endHour: 13,
        type: 'study', label: 'University Study', color: BLOCK_COLORS['study'],
      });
      blocks.push({
        id: generateId(), date: dateStr,
        startHour: 15, endHour: 18,
        type: 'study', label: 'University Study', color: BLOCK_COLORS['study'],
      });
    }
  }

  await db.timeBlocks.bulkAdd(blocks);
  console.log(`Seeded ${blocks.length} calendar blocks for 2 weeks`);
}
