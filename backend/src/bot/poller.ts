import { config } from '../config/env';
import { buildOpenAppButton, getUpdates, sendMessageToUser, type MaxUpdate } from '../max/botClient';
import { upsertFromMax } from '../services/userService';
import type { MaxAuthUser } from '../types';

let running = false;
let marker: number | undefined;

/** Достаём пользователя из разных форм апдейта (message.sender | user). */
function extractUser(u: MaxUpdate): MaxAuthUser | null {
  const src = u.message?.sender ?? u.user;
  const idNum = src?.user_id ?? u.user_id;
  if (idNum === undefined || idNum === null) return null;

  const first =
    (src?.first_name as string | undefined) ||
    (src?.name as string | undefined) ||
    '';
  return {
    id: String(idNum),
    first_name: first,
    last_name: (src?.last_name as string | undefined) ?? null,
    username: (src?.username as string | undefined) ?? null,
  };
}

export async function handleUpdate(u: MaxUpdate): Promise<void> {
  const user = extractUser(u);
  if (!user) return;

  // Регистрируем/обновляем пользователя (он "взаимодействовал с ботом")
  await upsertFromMax(user).catch((e) =>
    console.error('[poller] upsert error:', (e as Error).message),
  );

  const text = u.message?.body?.text?.trim();
  const isStart = u.update_type === 'bot_started' || text === '/start';
  if (isStart) {
    const greeting =
      `Здравствуйте, ${user.first_name || 'пользователь'}!\n` +
      `Это бот планировщика задач команды.\n\n` +
      `Ваш MAX ID: ${user.id}\n` +
      `Откройте мини-приложение, чтобы увидеть свои задачи.`;
    await sendMessageToUser(user.id, greeting, buildOpenAppButton()).catch((e) =>
      console.error('[poller] reply error:', (e as Error).message),
    );
  }
}

async function loop(): Promise<void> {
  while (running) {
    try {
      const { updates, marker: nextMarker } = await getUpdates(marker, 30, 100);
      for (const u of updates) {
        await handleUpdate(u);
      }
      if (nextMarker !== undefined) marker = nextMarker;
    } catch (err) {
      console.error('[poller] ошибка опроса /updates:', (err as Error).message);
      // Небольшая пауза перед повтором, чтобы не спамить при недоступности API
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export function startPolling(): void {
  if (config.botUpdatesMode !== 'polling') return;
  if (running) return;
  running = true;
  console.log('[poller] запущен long-polling MAX (GET /updates)');
  void loop();
}

export function stopPolling(): void {
  running = false;
}
