from db.main_model import Booking, User
from Settings import settings
import datetime

week_days_ru = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]

def create_booking_msg(grouped:dict[str,dict[str,list[Booking]]])->str:
    result = "Расписание бронирований\n"
    for key, value in grouped.items():
        dt = datetime.datetime.fromisoformat(key)
        result += f'🎾{week_days_ru[dt.weekday()]} {dt.strftime("%d/%m/%Y")} 🎾:\n'
        for court_name, bookings in value.items():
            result += f'\t{court_name}\n'
            for book in bookings:
                result += f'\t  С {book.start_time.strftime("%H:%M")} до {book.end_time.strftime("%H:%M")}\n'
                result += f'\t  {book.user.username}\n'
    return result
def create_notify_booking(book:Booking):
    return  f'⏰ Напоминаем вам что через {settings.reminder_lead_time} минут начинается ваше бронирование.\n{"="*15}\nДетали бронирования:\nВремя: с {book.start_time.strftime("%H:%M")} по {book.end_time.strftime("%H:%M")}.\nКорт: {book.court.name.lower()}\nСтоимость: {round(book.fee)} руб.\n{"="*15}\nРеквизиты оплаты:\nНомер получателя: +7(928) 270-20-71\nБанк: Ozon bank\nПолучатель: Александр Николаевич Г.\nПримечание: скрин платежа отправить @marumelnikova\n{"="*15}\nC уважением админстрация кортов\nХорошей вам игры\nСоблюдайте и чтите кодекс теннисиста☝.'
