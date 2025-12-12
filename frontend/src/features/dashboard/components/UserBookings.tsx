"use client";
import { useEffect, useState } from "react";
import { BookingInfo } from "@/schemas/Schemas";
import UpDownCollapse from "../../../components/ui/custom/UpDownCollaps";
import { SimpleTable } from "@/components/tables/simpleTable/SimpleTable";
import { dashbordColumns } from "../columns/dashbordColumns";
import Link from "next/link";
import AcceptDialog from "@/components/ui/accept-dialog";
import { useUserBooking } from "../hooks/useUserBooking";
import {
  initData,
  isMainButtonMounted,
  mountMainButton,
  useSignal,
} from "@telegram-apps/sdk-react";
import { SetMainButton } from "@/utils/tgUtils";
import Loader from "@/components/layouts/Loader";
import { MAIN_BUTTON_DELETE, MAIN_BUTTON_MAIN } from "@/styles/styles";
import { useEditController } from "@/hooks/useEditController";
import {
  getCoreRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";

export function UserBooking() {
  const user = useSignal(initData.user);
  if (!user) {
    throw new Error("Пользователь не аутентифицирован.");
  }
  if (!isMainButtonMounted()) {
    mountMainButton();
  }
  const usrBook = useUserBooking(user.id);

  if (usrBook.isEmpty) {
    <div className="w-full h-screen">
      <Link
        href={"/"}
        className="mx-auto px-4 py-3 rounded-lg hover:bg-orange-100 hover:text-amber-700 my-auto text-xl text-orange-500 w-max block border shadow-2xl text-center"
      >
        Забронировать корт !
      </Link>
    </div>;
  }
  const [open, setOpen] = useState<boolean>(false);
  const mainButtonClick = async () => {
    if (usrBook.tableNum === 2) {
      setOpen(true);
    } else {
      await usrBook.ChangeStatusOnPicked(3);
    }
  };
  useEffect(() => {
    SetMainButton(
      {
        isEnabled: true,
        isVisible: usrBook.isSelected,
        text:
          usrBook.tableNum === 0
            ? `Удалить`
            : `Подтвердить платеж ${usrBook.fee} руб`,
        backgroundColor:
          usrBook.tableNum === 0 ? MAIN_BUTTON_DELETE : MAIN_BUTTON_MAIN,
      },
      mainButtonClick
    );
  }, [usrBook.picked]);

  const unpaidClmns = dashbordColumns();
  const upcomingClmns = dashbordColumns();
  //
  const upcomingTable = useReactTable<BookingInfo>({
    data: usrBook.upcomingBookings,
    columns: upcomingClmns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (rows: {}) => {
      changeCurrentTable(0, rows);
    },
    state: {
      rowSelection: usrBook.upcomingRows,
    },
    getRowId: (row) => `${row.id}`,
  });
  const unpaidTable = useReactTable<BookingInfo>({
    data: usrBook.unpaidBookings,
    columns: unpaidClmns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (rows: {}) => {
      changeCurrentTable(2, rows);
    },
    state: {
      rowSelection: usrBook.unpaidRows,
    },
    getRowId: (row) => `${row.id}`,
  });

  const changeCurrentTable = (numTable: 0 | 2, rows: {}) => {
    usrBook.SetTableNum(numTable);
    if (numTable === 0) {
      usrBook.setUnpaidRows({});
      usrBook.setUpcomigRows(rows);
    } else {
      usrBook.setUnpaidRows(rows);
      usrBook.setUpcomigRows({});
    }
  };

  if (usrBook.isLoading) {
    let text = "Удаляем бронирования";
    if (usrBook.tableNum === 2) {
      text = "Проводим оплату";
    }
    return <Loader message={text} />;
  }
  return (
    <div className="w-full mt-8 flex flex-col gap-4">
      {usrBook.unpaidBookings.length ? (
        <UpDownCollapse
          title="Завершенные"
          collapsible={
            <SimpleTable
              table={unpaidTable}
              onResetRow={(row) => usrBook.setUnpaidRows({})}
            />
          }
        />
      ) : null}
      {usrBook.upcomingBookings.length ? (
        <UpDownCollapse
          title="Предстоящие"
          collapsible={
            <SimpleTable
              table={upcomingTable}
              onResetRow={(row) => usrBook.setUpcomigRows({})}
            />
          }
        />
      ) : null}
      <AcceptDialog
        isOpen={open}
        cancelCallback={() => setOpen(false)}
        okCallback={async () => {
          await usrBook.ChangeStatusOnPicked(1);
          setOpen(false);
        }}
        text={
          <div>
            <h6 className="my-4">{`Подтвердить платеж на сумму ${usrBook.fee} руб`}</h6>
            <p className="font-light text-sm p-4 border rounded-lg">
              <span className="text-normal inline-block my-2 font-normal ">
                Реквизиты:
              </span>
              <br />
              Номер телефона: +79282702071 <br />
              Ф.И.О: Александр Н.
              <br />
              Банк: Озон Банк
            </p>
          </div>
        }
        title="Оплата корта"
      />
      {usrBook.isLoading ? <Loader message="hello" /> : null}
    </div>
  );
}
