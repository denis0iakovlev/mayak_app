"use client";
import { UserInfo } from "@/schemas/Schemas";
import { AddOrUpdateTgUser } from "@/services/shareServices";
import { initData, useSignal } from "@telegram-apps/sdk-react";

import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext<UserInfo | null>(null);

export const UserInitiliazer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = useSignal(initData.user);
  const [mUser, SetMUser] = useState<UserInfo | null>(null);
  const [isLoading, SetLoading] = useState<boolean>(false);
  const [error, SetError] = useState<string>("");

  useEffect(() => {
    const checkUserAndGetUser = async () => {
      try {
        SetError("");
        SetLoading(true);
        if (user) {
          const usr = await AddOrUpdateTgUser(user);
          SetMUser(usr);
        } else {
          throw new Error("Не удалось извлечь данные Телеграмма");
        }
      } catch (e) {
        if (e instanceof Error) {
          SetError(e.message);
        } else {
          SetError("Не удалось зарегистрировать пользователя");
        }
      } finally {
        SetLoading(false);
      }
    };
    checkUserAndGetUser();
  }, []);
  if (isLoading) {
    return <div>Данные загружаются</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  return <UserContext.Provider value={mUser}>{children}</UserContext.Provider>;
};

export const useMayakUser = () => useContext(UserContext);
