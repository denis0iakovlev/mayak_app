import { Dialog, DialogContent, DialogFooter, DialogTrigger, DialogClose, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";

export type AcceptDialogProps =
    {
        isOpen: boolean,
        okCallback: () => void,
        cancelCallback: () => void,
        title: string,
        text: string|React.ReactNode

    }

export default function AcceptDialog({ isOpen, okCallback, cancelCallback, text, title }: AcceptDialogProps) {
    return (
        <Dialog open={isOpen} modal={true}>
            <DialogTrigger>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>
                    {title}
                </DialogTitle>
                {text}
                <DialogFooter className="flex flex-row justify-end grid-2" >
                    <Button variant="outline" onClick={cancelCallback} >Отменить</Button>
                    <Button variant="default" onClick={okCallback} >Принять</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}