import { mainButton } from "@telegram-apps/sdk-react";
import { RGB } from "@telegram-apps/sdk-react";
export type MainButtonParams = Partial<{
    backgroundColor?: RGB;
    hasShineEffect: boolean;
    isEnabled: boolean;
    isLoaderVisible: boolean;
    isVisible: boolean;
    text: string;
    textColor?: RGB;
}>

let prev: any = null;

export function SetMainButton(params: MainButtonParams, callback: () => void) {
    if (!mainButton.isMounted()) {
        mainButton.mount();
    }
    if (mainButton.onClick.isAvailable()) {
        if (prev !== null) {
            mainButton.offClick(prev)
        }
        mainButton.onClick(callback);
        prev = callback;
    }
    mainButton.setParams(params);
}
