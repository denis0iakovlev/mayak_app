import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";

export default function Loader({message}:{message:string}){
    return(
        <div className="flex max-full h-screen items-center justify-center">
            <Item variant="muted" className="max-w-sm overflow-auto">
                <ItemMedia>
                    <Spinner />
                </ItemMedia>
                <ItemContent >
                    <ItemTitle className="line-clamp-1 overflow-visible break-words whitespace-normal">{message}</ItemTitle>
                </ItemContent>
            </Item>
        </div>
    )
}