'use client'

import { useEffect } from "react";

const botName = process.env.NEXT_PUBLIC_BOT_NAME!;

export default function TelegramLogging() {
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth');
        script.setAttribute('data-request-access', 'write');
        document.getElementById('telegram-button-container')?.appendChild(script);

    }, [])
}