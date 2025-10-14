"use client"

export default function IndexError({error, reset}:{
    error:Error,
    reset:()=>void
})
{
    return(
        <section className="flex-col items-center justify-center shadow border rounded-xl ">
            <h2 className="font-medium text-red-600">Упс, что то пошло не так ...</h2>
            <p className="mt-2 text-sm">{error.message}</p>
        </section>
    )
}