type CriticalErrorProps = {
    headerText: string,
    errorMessage: string
}

export default function CriticalError({ headerText, errorMessage }: CriticalErrorProps) {
    return (
        <div className="flex
        items-center justify-center h-screen"
        >
            <div className="p-4  self-center  flex flex-col gap-3 border shadow-md shadow-amber-200 
        rounded-xl border-amber-300">
                <h6 className="text-xl font-bold text-red-600">{headerText}</h6>
                <p className="text-md max-w-2/3 overflow-auto">
                    {errorMessage}
                </p>
            </div>
        </div>
    )
}