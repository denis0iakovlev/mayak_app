from db.main_model import Booking, User
from Settings import settings

def create_booking_msg(grouped:dict[str,dict[str,list[Booking]]])->str:
    result = "Расписание бронирований\n"
    for key, value in grouped.items():
        result += f"🎾{key}🎾:\n"
        for court_name, bookings in value.items():
            result += f'\t{court_name}\n'
            for book in bookings:
                result += f'\t  С {book.start_time.strftime("%H:%M")} до {book.end_time.strftime("%H:%M")}\n'
                result += f'\t  {book.user.username}\n'
    return result
def create_notify_booking(book:Booking):
    return  f'⏰ Напоминаем вам что через {settings.reminder_lead_time} минут начинается ваше бронирование.\nДетали бронирования:\nВремя: с {book.start_time.strftime("%H:%M")} по {book.end_time.strftime("%H:%M")}.\nКорт: {book.court.name.lower()}\nСтоимость: {round(book.fee)} руб.\nНомер получателя: +7(928) 270-20-71 (Озон банк, Александр Николаевич Г.)\n C уважением админстрация кортов\nХорошей вам игры и соблюдайте и чтите кодекс теннисиста.'