'use client';

import { useEffect, useState } from 'react';
import eruda from "eruda"
import { init, initDataChat, restoreInitData, } from '@telegram-apps/sdk-react';

export const TelegramInitializer = ({ children }: { children: React.ReactNode }) => {
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        const runInit = async () => {
            try {
                init();
                initDataChat();
                //eruda.init();
                restoreInitData();
                setInitialized(true);

            } catch (error) {
                console.error('Failed to initialize Telegram SDK:', error);
                // Можно показать заглушку или fallback UI
            }
        };
        runInit();
    }, []);

    if (!initialized) {
        return <div>Загрузка Telegram SDK...</div>; // или null
    }
    return <>{children}</>;
};
